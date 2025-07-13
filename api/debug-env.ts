import type { VercelRequest, VercelResponse } from '@vercel/node';

// Este endpoint serve apenas para depurar as variáveis de ambiente no servidor da Vercel.
export default function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  console.log('--- INICIANDO DEBUG DE VARIÁVEIS DE AMBIENTE ---');
  console.log(process.env);
  console.log('--- FIM DO DEBUG ---');

  // Por segurança, não enviamos os valores das chaves na resposta.
  // Apenas as chaves, para confirmar que foram carregadas.
  const availableKeys = Object.keys(process.env);
  
  response.status(200).json({
    message: "Verificação de variáveis de ambiente no servidor.",
    keys_disponiveis: availableKeys,
  });
}
