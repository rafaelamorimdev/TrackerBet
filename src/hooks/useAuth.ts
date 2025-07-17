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
// --- CORREÇÃO: Importar 'runTransaction' ---
import { doc, setDoc, onSnapshot, updateDoc, increment, collection, addDoc, Timestamp, runTransaction } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { User as AppUser } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubscriber, setIsSubscriber] = useState(false);

  // O seu useEffect existente, que está correto.
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
              // Adiciona o campo de mercados personalizados para novos utilizadores
              customMarkets: { futebol: [], basquete: [] }
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

  // Sua função de updateBankroll existente
  const updateBankroll = async (amount: number, type: 'deposit' | 'withdrawal') => {
    if (!user) throw new Error("Utilizador não autenticado.");

    const userDocRef = doc(db, 'users', user.uid);
    const amountToUpdate = type === 'deposit' ? amount : -amount;

    if (type === 'withdrawal' && user.currentBankroll < amount) {
        throw new Error("O valor do saque não pode ser maior que a banca atual.");
    }

    await updateDoc(userDocRef, {
        currentBankroll: increment(amountToUpdate)
    });

    const transactionsCollectionRef = collection(db, 'bankrollTransactions');
    await addDoc(transactionsCollectionRef, {
        userId: user.uid,
        type: type,
        amount: amount,
        createdAt: Timestamp.now()
    });
  };

  // --- NOVA FUNÇÃO PARA ADICIONAR UM MERCADO PERSONALIZADO ---
  const addCustomMarket = async (sport: 'futebol' | 'basquete', marketName: string) => {
    if (!user) throw new Error("Utilizador não autenticado.");
    if (!marketName.trim()) throw new Error("O nome do mercado não pode estar vazio.");

    const userDocRef = doc(db, 'users', user.uid);
    const marketToAdd = marketName.trim();

    try {
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists()) {
          throw new Error("Documento do utilizador não encontrado.");
        }

        const data = userDoc.data();
        const customMarkets = data.customMarkets || { futebol: [], basquete: [] };
        
        if (!customMarkets[sport].includes(marketToAdd)) {
          customMarkets[sport].push(marketToAdd);
        }

        transaction.update(userDocRef, { customMarkets: customMarkets });
      });
    } catch (error) {
      console.error("Erro ao adicionar mercado personalizado:", error);
      throw new Error("Não foi possível guardar o novo mercado.");
    }
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
    updateBankroll,
    addCustomMarket // <-- Exporta a nova função
  };
};
