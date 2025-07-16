// Caminho: src/hooks/useBets.ts

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';
import { Bet } from '../types';

export const useBets = () => {
  const { user, isAdmin, isSubscriber } = useAuth(); 
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hasAccess = isAdmin || isSubscriber;
    if (!user || !hasAccess) {
      setBets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "bets"), 
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userBets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bet));
      setBets(userBets);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching bets:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isAdmin, isSubscriber]); 

  // --- FUNÇÃO ADICIONADA AQUI ---
  const addBet = async (betData: { game: string; market: string; odd: number; stake: number; }) => {
    if (!user) throw new Error("Utilizador não autenticado.");

    const newBet = {
      ...betData,
      userId: user.uid,
      createdAt: Timestamp.now(),
      result: 'pending',
      profit: 0,
    };

    try {
      const betsCollectionRef = collection(db, 'bets');
      await addDoc(betsCollectionRef, newBet);
    } catch (error) {
      console.error("Erro ao adicionar aposta: ", error);
      throw new Error("Não foi possível registar a aposta.");
    }
  };

  // --- EXPORTAÇÃO ATUALIZADA ---
  return { bets, loading, addBet };
};
