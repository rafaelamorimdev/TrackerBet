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
    const abacatePaySecretKey = process.env.ABACATEPAY_SECRET_KEY;
    if (!abacatePaySecretKey) {
      throw new Error('A chave de API do gateway de pagamento não está configurada.');
    }

    const { user, plan } = request.body;
    if (!user || !plan || !user.taxId || !user.cellphone) {
      return response.status(400).json({ error: 'Dados do utilizador, plano, CPF e telemóvel são obrigatórios.' });
    }

    const sanitizedTaxId = user.taxId.replace(/\D/g, '');
    const sanitizedCellphone = user.cellphone.replace(/\D/g, '');

    const apiURL = "https://api.abacatepay.com/v1/billing/create";

    const payload = {
      // O campo devMode foi removido. A API agora opera em modo de produção.
      // É CRUCIAL que os dados do cliente (taxId, cellphone) sejam válidos.
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
          taxId: sanitizedTaxId,
          cellphone: sanitizedCellphone,
      },
      metadata: {
        planId: plan.id,
        userId: user.uid,
      }
    };

    console.log("Enviando para o AbacatePay:", JSON.stringify(payload, null, 2));

    const apiResponse = await fetch(apiURL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${abacatePaySecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
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
