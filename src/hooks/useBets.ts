// Caminho: src/hooks/useBets.ts

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, addDoc, Timestamp, doc, runTransaction, increment } from 'firebase/firestore';
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

  // --- CORREÇÃO APLICADA AQUI ---
  // Função para atualizar o status da aposta, usando 'anulada' em vez de 'void'
  const updateBetStatus = async (bet: Bet, newResult: 'green' | 'red' | 'anulada') => {
    if (!user || bet.result !== 'pending') {
      throw new Error("Apenas apostas pendentes podem ser atualizadas.");
    }

    const betRef = doc(db, "bets", bet.id);
    const userRef = doc(db, "users", user.uid);

    let profit = 0;
    let bankrollChange = 0;

    if (newResult === 'green') {
      profit = (bet.stake * bet.odd) - bet.stake;
      bankrollChange = bet.stake * bet.odd;
    } else if (newResult === 'red') {
      profit = -bet.stake;
      bankrollChange = 0;
    } else if (newResult === 'anulada') { // Alterado de 'void' para 'anulada'
      profit = 0;
      bankrollChange = bet.stake;
    }

    try {
      await runTransaction(db, async (transaction) => {
        transaction.update(betRef, { result: newResult, profit: profit });
        transaction.update(userRef, { currentBankroll: increment(bankrollChange) });
      });
    } catch (error) {
      console.error("Erro na transação ao atualizar aposta:", error);
      throw new Error("Erro ao atualizar aposta.");
    }
  };

  return { bets, loading, addBet, updateBetStatus };
};
