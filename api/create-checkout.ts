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

    const { user, plan } = request.body;
    if (!user || !plan || !user.taxId) {
      return response.status(400).json({ error: 'Dados do utilizador, plano e CPF são obrigatórios.' });
    }

    const apiURL = "https://api.abacatepay.com/v1/billing/create";

    const apiResponse = await fetch(apiURL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${abacatePaySecretKey}`,
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
        // --- CORREÇÃO APLICADA AQUI ---
        // Alterado para o URL principal da sua aplicação.
        // Após o pagamento, o utilizador será redirecionado para a página inicial,
        // que por sua vez irá mostrar o dashboard, pois ele já está logado.
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
      throw new Error(errorBody.message || "Erro no gateway de pagamento. Verifique os logs do terminal.");
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
