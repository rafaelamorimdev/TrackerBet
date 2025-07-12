import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createHmac, timingSafeEqual } from 'crypto';

// --- Configuração do Firebase Admin ---
// Verifica se a app já foi inicializada para evitar erros em ambientes serverless
if (!getApps().length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
  );
  
  initializeApp({
    credential: cert(serviceAccount),
  });
}
// A variável 'db' agora será usada dentro da função 'handler'
const db = getFirestore();

// --- Configuração da Vercel para ler o corpo bruto (raw body) ---
// Isto é essencial para a verificação da assinatura do webhook.
export const config = {
  api: {
    bodyParser: false,
  },
};

// Função auxiliar para converter a stream da requisição em um buffer
async function buffer(req: VercelRequest) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}


// Função que recebe as confirmações de pagamento do AbacatePay
export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).send('Método não permitido');
  }

  const rawBody = await buffer(request);

  try {
    // ETAPA 1: VERIFICAÇÃO DA ASSINATURA (SEGURANÇA)
    const webhookSecret = process.env.ABACATEPAY_WEBHOOK_SECRET;
    const signature = request.headers['abacatepay-signature'] as string;

    if (!webhookSecret || !signature) {
      console.warn('Webhook recebido sem credenciais de assinatura.');
      return response.status(401).send('Credenciais de assinatura ausentes.');
    }

    const hmac = createHmac('sha256', webhookSecret);
    const digest = hmac.update(rawBody).digest('hex');
    
    const receivedSignature = Buffer.from(signature, 'utf-8');
    const computedSignature = Buffer.from(digest, 'utf-8');

    if (!timingSafeEqual(receivedSignature, computedSignature)) {
      return response.status(401).send('Assinatura do webhook inválida.');
    }
    
    // Se a assinatura é válida, podemos fazer o "parse" do corpo agora
    const event = JSON.parse(rawBody.toString());

    // ETAPA 2: VERIFICAÇÃO DE IDEMPOTÊNCIA (ROBUSTEZ)
    const eventId = event.id;
    if (!eventId) {
      return response.status(400).send('ID do evento ausente no corpo da requisição.');
    }

    const eventRef = db.collection('processed_webhooks').doc(eventId);
    const eventDoc = await eventRef.get();

    if (eventDoc.exists) {
      // Este evento já foi processado com sucesso.
      return response.status(200).json({ message: 'Evento já processado.' });
    }

    // ETAPA 3: LÓGICA DE NEGÓCIO
    if (event.event === 'billing.paid' || (event.event === 'billing.updated' && event.data?.status === 'PAID')) {
      const billingData = event.data?.billing || event.data;
      const userId = billingData?.customer?.id;
      const planId = billingData?.metadata?.planId;

      if (!userId) {
        throw new Error('ID do utilizador em falta no evento do webhook.');
      }

      const subscriptionEndDate = new Date();
      if (planId === 'monthly') {
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
      } else if (planId === 'quarterly') {
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 3);
      } else if (planId === 'annual') {
        subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
      }

      const userRef = db.collection('users').doc(userId);
      await userRef.update({
        subscriptionStatus: 'active',
        plan: planId,
        subscriptionEndDate: subscriptionEndDate,
      });

      // ETAPA 4: PERSISTE O SUCESSO DO PROCESSAMENTO
      // Salva o ID do evento na nossa coleção de controle para garantir a idempotência
      await eventRef.set({ 
        processedAt: new Date(), 
        eventType: event.event 
      });
    }

    return response.status(200).json({ received: true });

  } catch (error) {
    console.error("Erro no webhook:", error);
    return response.status(500).json({ error: 'Erro interno ao processar o webhook.' });
  }
}
