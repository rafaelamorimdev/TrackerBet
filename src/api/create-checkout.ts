import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).send('Método não permitido');
  }

  try {
    const abacatePaySecretKey = process.env.ABACATEPAY_SECRET_KEY;
    if (!abacatePaySecretKey) {
      throw new Error('A chave de API do gateway de pagamento não está configurada.');
    }

    const { userId, planId, price } = request.body;
    if (!userId || !planId || !price) {
      return response.status(400).json({ error: 'Dados em falta.' });
    }

    const apiURL = "https://api.abacatepay.com/v1/checkout-sessions";
    const apiResponse = await fetch(apiURL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${abacatePaySecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: price * 100,
        currency: "BRL",
        customer_id: userId,
        metadata: { planId },
        success_url: "https://trackerbet.vercel.app/sucesso",
        cancel_url: "https://trackerbet.vercel.app/planos",
      }),
    });

    const session = await apiResponse.json();
    if (!apiResponse.ok) {
      throw new Error(session.error?.message || "Erro no AbacatePay");
    }

    return response.status(200).json({ checkoutUrl: session.url });

  } catch (error) {
    console.error("Erro na função serverless:", error);
    return response.status(500).json({ error: 'Erro interno ao processar o pagamento.' });
  }
}