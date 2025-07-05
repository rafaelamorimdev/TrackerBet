import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// --- Configuração do Firebase Admin ---
// Verifica se a app já foi inicializada para evitar erros em ambientes serverless
if (!getApps().length) {
  // Obtém as credenciais da variável de ambiente que configurou na Vercel
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
  );
  
  initializeApp({
    credential: cert(serviceAccount),
  });
}
//funcionando perfeitamente.
const db = getFirestore();

// Função que recebe as confirmações de pagamento do AbacatePay
export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).send('Método não permitido');
  }

  try {
    const event = request.body;
    
    // TODO: Implementar a verificação da assinatura do webhook aqui.
    // Esta é uma etapa de segurança crucial para garantir que a notificação é genuína.
    // const webhookSecret = process.env.ABACATEPAY_WEBHOOK_SECRET;
    // const signature = request.headers['abacatepay-signature'];
    // if (!isValidSignature(signature, request.body, webhookSecret)) {
    //   return response.status(401).send('Assinatura inválida.');
    // }

    // Com base na sua documentação, o evento de sucesso é 'billing.paid'
    if (event.event === 'billing.paid' || (event.event === 'billing.updated' && event.data?.status === 'PAID')) {
      const billingData = event.data?.billing || event.data;
      const userId = billingData?.customer?.id;
      const planId = billingData?.metadata?.planId;

      if (!userId) {
        throw new Error('ID do utilizador em falta no evento do webhook.');
      }

      // Calcula a data de expiração da subscrição
      const subscriptionEndDate = new Date();
      if (planId === 'monthly') {
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
      } else if (planId === 'quarterly') {
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 3);
      } else if (planId === 'annual') {
        subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
      }

      // Atualiza o documento do utilizador no Firestore
      const userRef = db.collection('users').doc(userId);
      await userRef.update({
        subscriptionStatus: 'active',
        plan: planId,
        subscriptionEndDate: subscriptionEndDate,
      });
    }

    return response.status(200).json({ received: true });

  } catch (error) {
    console.error("Erro no webhook:", error);
    return response.status(500).json({ error: 'Erro interno ao processar o webhook.' });
  }
}
