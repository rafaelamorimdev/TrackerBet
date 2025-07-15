

import * as admin from 'firebase-admin';
import { UserRecord } from 'firebase-admin/auth';
import * as dotenv from 'dotenv';

// Carrega as variáveis do seu arquivo .env na raiz do projeto
dotenv.config();

// Lê a variável de ambiente correta do seu arquivo .env
const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

// Verifica se a variável foi encontrada
if (!serviceAccountString) {
  throw new Error("A variável de ambiente FIREBASE_SERVICE_ACCOUNT_KEY não foi definida no seu arquivo .env");
}

// Converte a string JSON em um objeto que o Firebase entende
const serviceAccount = JSON.parse(serviceAccountString);

// --- O RESTO DO SCRIPT PERMANECE IGUAL ---

const ADMIN_EMAIL: string = "rafael.ceb2010@gmail.com";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function setInitialAdmin(): Promise<void> {
  console.log(`Procurando pelo usuário com o email: ${ADMIN_EMAIL}...`);

  try {
    const user: UserRecord = await admin.auth().getUserByEmail(ADMIN_EMAIL);

    if (user.customClaims?.admin === true) {
      console.log(`O usuário ${ADMIN_EMAIL} já é um administrador.`);
      process.exit(0);
    }

    await admin.auth().setCustomUserClaims(user.uid, { admin: true });

    console.log("---------------------------------------------------------------");
    console.log("✅ SUCESSO!");
    console.log(`O usuário ${ADMIN_EMAIL} (UID: ${user.uid}) agora é um administrador.`);
    console.log("---------------------------------------------------------------");

    process.exit(0);

  } 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catch (error: any) {
    console.error("❌ ERRO ao tentar definir o administrador inicial:");
    if (error.code === 'auth/user-not-found') {
      console.error(`Nenhum usuário foi encontrado com o email: ${ADMIN_EMAIL}.`);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

setInitialAdmin();