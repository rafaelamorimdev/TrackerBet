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

const db = getFirestore();

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).send('Método não permitido');
  }

  try {
    const event = request.body;
    
    // TODO: Adicionar lógica para verificar a assinatura do webhook aqui.
    // Esta é uma etapa de segurança crucial para garantir que a notificação é genuína.

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.customer_id;
      const planId = session.metadata.planId;

      if (!userId) {
        throw new Error('ID do utilizador em falta no evento do webhook.');
      }

      const userRef = db.collection('users').doc(userId);
      await userRef.update({
        subscriptionStatus: 'active',
        plan: planId,
        // TODO: Calcular e guardar a data de expiração da subscrição
      });
    }

    return response.status(200).json({ received: true });

  } catch (error) {
    console.error("Erro no webhook:", error);
    return response.status(500).json({ error: 'Erro interno ao processar o webhook.' });
  }
}
