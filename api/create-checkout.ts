import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).send('Método não permitido');
  }

  try {
    // LINHA DE DEBUG ADICIONADA: Verificando as variáveis disponíveis no log.
    console.log('Executando create-checkout. Chaves de ambiente disponíveis:', Object.keys(process.env));

    const abacatePayApiKey = process.env.ABACATEPAY_API_KEY;
    if (!abacatePayApiKey) {
      // Este é o erro que está acontecendo. O log acima nos dirá o porquê.
      throw new Error('A chave de API do gateway de pagamento não está configurada.');
    }

    const { user, plan } = request.body;
    if (!user || !plan || !user.taxId) {
      return response.status(400).json({ error: 'Dados do utilizador, plano e CPF são obrigatórios.' });
    }

    const apiURL = "https://api.abacatepay.com/v1/billing/create";

    const apiResponse = await fetch(apiURL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${abacatePayApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        products: [
          {
            externalId: plan.id,
            name: `Subscrição ${plan.name}`,
            price: plan.price * 100,
            quantity: 1,
          }
        ],
        frequency: "ONE_TIME",
        methods: ["PIX"],
        returnUrl: "https://tracker-bet-96pu.vercel.app/planos",
        completionUrl: "https://tracker-bet-96pu.vercel.app/",
        customer: {
            id: user.uid,
            name: user.displayName || user.email,
            email: user.email,
            cellphone: "11999999999",
            taxId: user.taxId,
        },
      }),
    });

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.json();
      console.error("Erro recebido do AbacatePay:", errorBody);
      throw new Error(errorBody.message || "Erro no gateway de pagamento.");
    }

    const session = await apiResponse.json();
    const checkoutUrl = session.data?.url;

    if (!checkoutUrl) {
      console.error("Resposta do AbacatePay sem URL de checkout:", session);
      throw new Error("URL de pagamento não foi retornado pela API.");
    }

    return response.status(200).json({ checkoutUrl });

  } catch (error) {
    console.error("Erro na função serverless:", error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno ao processar o pagamento.';
    return response.status(500).json({ error: errorMessage });
  }
}
