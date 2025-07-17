// Caminho: src/hooks/useAuth.ts

import { useState, useEffect } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  confirmPasswordReset
} from 'firebase/auth';
// --- CORREÇÃO: Importar 'updateDoc' e 'increment' ---
import { doc, setDoc, onSnapshot, updateDoc, increment, collection, addDoc, Timestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { User as AppUser } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubscriber, setIsSubscriber] = useState(false);

  // ... (o seu useEffect existente permanece igual)
  useEffect(() => {
    let unsubscribeFromFirestore: (() => void) | null = null;

    const unsubscribeFromAuth = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (unsubscribeFromFirestore) {
        unsubscribeFromFirestore();
      }

      if (!firebaseUser) {
        setUser(null);
        setIsAdmin(false);
        setIsSubscriber(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const tokenResult = await firebaseUser.getIdTokenResult(true);
        
        const isAdminStatus = tokenResult.claims.admin === true;
        const isSubscriberStatus = tokenResult.claims.plan === 'premium';

        setIsAdmin(isAdminStatus);
        setIsSubscriber(isSubscriberStatus);

        const userDocRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeFromFirestore = onSnapshot(userDocRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            setUser({ uid: firebaseUser.uid, ...docSnapshot.data() } as AppUser);
          } else {
            const newUser: AppUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || null,
              photoURL: firebaseUser.photoURL || null,
              initialBankroll: 0,
              currentBankroll: 0,
            };
            setDoc(userDocRef, newUser).then(() => setUser(newUser));
          }
          setLoading(false);
        });

      } catch (e) {
        console.error("Erro durante o processamento da autenticação:", e);
        setError("Não foi possível verificar as permissões.");
        setLoading(false);
      }
    });

    return () => {
      unsubscribeFromAuth();
      if (unsubscribeFromFirestore) {
        unsubscribeFromFirestore();
      }
    };
  }, []);

  // --- NOVA FUNÇÃO ADICIONADA AQUI ---
  const updateBankroll = async (amount: number, type: 'deposit' | 'withdrawal') => {
    if (!user) throw new Error("Utilizador não autenticado.");

    const userDocRef = doc(db, 'users', user.uid);
    const amountToUpdate = type === 'deposit' ? amount : -amount;

    // Garante que o saque não deixa a banca negativa
    if (type === 'withdrawal' && user.currentBankroll < amount) {
        throw new Error("O valor do saque não pode ser maior que a banca atual.");
    }

    // Atualiza o valor da banca do utilizador
    await updateDoc(userDocRef, {
        currentBankroll: increment(amountToUpdate)
    });

    // Regista a transação para o histórico
    const transactionsCollectionRef = collection(db, 'bankrollTransactions');
    await addDoc(transactionsCollectionRef, {
        userId: user.uid,
        type: type,
        amount: amount,
        createdAt: Timestamp.now()
    });
  };

  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCredential.user);
    return userCredential;
  };

  const loginWithGoogle = () => {
    return signInWithPopup(auth, googleProvider);
  };

  const logout = () => {
    return signOut(auth);
  };

  const sendPasswordReset = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };

  const doConfirmPasswordReset = (code: string, newPassword: string) => {
    return confirmPasswordReset(auth, code, newPassword);
  };

  return { 
    user, 
    loading, 
    isAdmin, 
    isSubscriber, 
    error, 
    login, 
    register, 
    loginWithGoogle, 
    logout, 
    sendPasswordReset, 
    confirmPasswordReset: doConfirmPasswordReset,
    updateBankroll // <-- Exporta a nova função
  };
};
