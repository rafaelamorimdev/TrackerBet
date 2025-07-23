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
import { doc, onSnapshot, Timestamp, getDoc, writeBatch, runTransaction, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeFromFirestore: (() => void) | null = null;

    const unsubscribeFromAuth = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (unsubscribeFromFirestore) unsubscribeFromFirestore();

      if (!firebaseUser) {
        setUser(null);
        setIsAdmin(false);
        setIsSubscriber(false);
        setLoading(false);
        return;
      }

      const userDocRef = doc(db, 'users', firebaseUser.uid);

      unsubscribeFromFirestore = onSnapshot(userDocRef, async (docSnapshot) => {
        if (docSnapshot.exists()) {
          // Utilizador existente: lê os dados, define o estado e termina o carregamento.
          const userData = docSnapshot.data();
          setIsAdmin(userData.role === 'admin');
          const accessUntil = userData.accessUntil as Timestamp | undefined;
          const hasActiveTrial = accessUntil ? accessUntil.toMillis() > Date.now() : false;
          setIsSubscriber(hasActiveTrial);
          setUser({ uid: firebaseUser.uid, ...userData } as User);
          setLoading(false);
        } else {
          // Novo utilizador: cria o documento. O onSnapshot irá disparar novamente com os novos dados.
          try {
            const newUserEmail = firebaseUser.email!;
            const preAuthRef = doc(db, 'preAuthorizedUsers', newUserEmail);
            let accessUntil: Timestamp | undefined = undefined;

            const preAuthSnap = await getDoc(preAuthRef);
            if (preAuthSnap.exists()) {
              accessUntil = preAuthSnap.data().accessUntil as Timestamp;
            }

            const newUser: User = {
                uid: firebaseUser.uid,
                email: newUserEmail,
                displayName: firebaseUser.displayName || null,
                photoURL: firebaseUser.photoURL || null,
                initialBankroll: 0,
                currentBankroll: 0,
                isSubscriber: !!accessUntil,
                accessUntil: accessUntil,
                createdAt: Timestamp.now(),
                customMarkets: { futebol: [], basquete: [] }
            };

            const batch = writeBatch(db);
            batch.set(userDocRef, newUser);
            if (accessUntil) {
                batch.delete(preAuthRef);
            }
            await batch.commit();
            // Não é preciso definir o estado aqui. O listener onSnapshot fará isso automaticamente.
          } catch (err) {
            console.error("Erro ao criar novo utilizador:", err);
            setError("Não foi possível criar o perfil do utilizador.");
            setLoading(false); // Termina o carregamento em caso de erro.
          }
        }
      }, (err) => {
        console.error("Erro no listener do onSnapshot:", err);
        setError("Não foi possível carregar os dados do usuário.");
        setLoading(false); // Termina o carregamento em caso de erro no listener.
      });
    });

    return () => unsubscribeFromAuth();
  }, []);
  
  // --- FUNÇÕES DE AÇÃO ---

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

  return { 
    user, 
    loading, 
    isAdmin, 
    isSubscriber,
    error,
    login,
    register,
    logout,
    loginWithGoogle,
    sendPasswordReset,
    confirmPasswordReset: doConfirmPasswordReset,
    updateBankroll,
    addCustomMarket
  };
};
