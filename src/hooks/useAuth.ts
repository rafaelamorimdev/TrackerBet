import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { User as AppUser } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeFromFirestore: (() => void) | null = null;

    const unsubscribeFromAuth = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (unsubscribeFromFirestore) {
        unsubscribeFromFirestore();
      }

      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        unsubscribeFromFirestore = onSnapshot(userDocRef, async (doc) => {
          if (doc.exists()) {
            setUser({ uid: firebaseUser.uid, ...doc.data() } as AppUser);
          } else {
            // --- CORREÇÃO APLICADA AQUI ---
            const newUser: AppUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              // Usar 'null' como fallback se o valor for undefined
              displayName: firebaseUser.displayName || null,
              photoURL: firebaseUser.photoURL || null,
              initialBankroll: 0,
              currentBankroll: 0,
            };
            await setDoc(userDocRef, newUser);
          }
          setLoading(false);
          setError(null);
        }, (err) => {
          console.error("Erro no listener do Firestore:", err);
          setError("Falha ao sincronizar dados do utilizador.");
          setLoading(false);
        });
      } else {
        setUser(null);
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

  const login = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    return signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    return signOut(auth);
  };

  return { user, loading, error, login, register, loginWithGoogle, logout };
};
