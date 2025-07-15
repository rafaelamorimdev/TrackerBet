// Caminho: src/hooks/useAuth.ts

import { useState, useEffect } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { User as AppUser } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubscriber, setIsSubscriber] = useState(false); // <-- NOVO ESTADO

  useEffect(() => {
    let unsubscribeFromFirestore: (() => void) | null = null;

    const unsubscribeFromAuth = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (unsubscribeFromFirestore) {
        unsubscribeFromFirestore();
      }

      if (!firebaseUser) {
        setUser(null);
        setIsAdmin(false);
        setIsSubscriber(false); // <-- Limpar estado de assinante
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const tokenResult = await firebaseUser.getIdTokenResult(true);
        
        // Verifica ambos os claims: admin e plano
        const isAdminStatus = tokenResult.claims.admin === true;
        const isSubscriberStatus = tokenResult.claims.plan === 'premium';

        setIsAdmin(isAdminStatus);
        setIsSubscriber(isSubscriberStatus); // <-- Define o estado de assinante

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
        }, (snapshotError) => {
          console.error("Erro no listener do Firestore:", snapshotError);
          setError("Falha ao carregar dados do utilizador.");
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

  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const register = (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = () => {
    return signInWithPopup(auth, googleProvider);
  };

  const logout = () => {
    return signOut(auth);
  };

  // <-- RETORNA O NOVO ESTADO 'isSubscriber'
  return { user, loading, isAdmin, isSubscriber, error, login, register, loginWithGoogle, logout };
};
