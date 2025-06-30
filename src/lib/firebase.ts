import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Objeto de configuração que agora lê as variáveis de ambiente
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Verifica se todas as variáveis foram carregadas corretamente
if (!firebaseConfig.apiKey) {
  throw new Error("A chave de API do Firebase não foi encontrada. Verifique o seu ficheiro .env.local");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Configura o provedor do Google
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Habilita a persistência offline do Firestore (forma recomendada)
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.warn("A persistência do Firestore falhou: múltiplas abas abertas.");
    } else if (err.code == 'unimplemented') {
      console.warn("A persistência do Firestore não é suportada neste navegador.");
    }
  });
