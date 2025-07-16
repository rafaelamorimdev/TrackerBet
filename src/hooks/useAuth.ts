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
  confirmPasswordReset // Importa a função para confirmar a nova senha
} from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { User as AppUser } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubscriber, setIsSubscriber] = useState(false);

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

  // Nova função para confirmar a redefinição de senha
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
    confirmPasswordReset: doConfirmPasswordReset // Exporta a nova função
  };
};
