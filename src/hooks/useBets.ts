// Caminho: src/hooks/useBets.ts

import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  Timestamp,
  doc,
  writeBatch,
  increment,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';
import { Bet, BankrollEntry, HistoryItem } from '../types';

// O tipo para os dados que vêm do formulário de nova aposta
type NewBetData = Pick<Bet, 'game' | 'market' | 'odd' | 'stake' | 'sport'>;

export const useBets = () => {
  const { user } = useAuth();
  const [bets, setBets] = useState<Bet[]>([]);
  const [transactions, setTransactions] = useState<BankrollEntry[]>([]);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setBets([]);
      setTransactions([]);
      setHistoryItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Listener para a coleção de 'bets'
    const betsQuery = query(collection(db, 'bets'), where("userId", "==", user.uid));
    const unsubscribeBets = onSnapshot(betsQuery, (snapshot) => {
      const betsData = snapshot.docs.map(doc => ({
        id: doc.id,
        type: 'bet' as const,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp).toDate(),
      } as Bet));
      setBets(betsData);
    });

    // Listener para a coleção de 'bankrollTransactions'
    const transQuery = query(collection(db, 'bankrollTransactions'), where("userId", "==", user.uid));
    const unsubscribeTrans = onSnapshot(transQuery, (snapshot) => {
      const transData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp).toDate(),
      } as BankrollEntry));
      setTransactions(transData);
    });

    return () => {
      unsubscribeBets();
      unsubscribeTrans();
    };
  }, [user]);

  // Efeito para juntar e ordenar os dados sempre que 'bets' ou 'transactions' mudarem
  useEffect(() => {
    const combinedItems = [...bets, ...transactions];
    combinedItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    setHistoryItems(combinedItems);
    if (loading) setLoading(false);
  }, [bets, transactions, loading]);

  const addBet = async (betData: NewBetData) => {
    if (!user) throw new Error("Utilizador não autenticado.");
    if (user.currentBankroll < betData.stake) {
      throw new Error("Saldo insuficiente na banca para esta aposta.");
    }

    const batch = writeBatch(db);
    const userDocRef = doc(db, 'users', user.uid);
    const newBetRef = doc(collection(db, 'bets'));

    const newBet: Omit<Bet, 'id' | 'type'> = {
      ...betData,
      userId: user.uid,
      createdAt: new Date(),
      result: 'pending',
      profit: 0
    };

    batch.set(newBetRef, { ...newBet, type: 'bet' });
    batch.update(userDocRef, { currentBankroll: increment(-betData.stake) });
    await batch.commit();
  };

  const updateBetStatus = async (bet: Bet, newResult: 'green' | 'red' | 'reembolso') => {
    if (!user) throw new Error("Utilizador não autenticado.");
    if (bet.result !== 'pending') throw new Error("Apenas apostas pendentes podem ser atualizadas.");

    const batch = writeBatch(db);
    const userDocRef = doc(db, 'users', user.uid);
    const betDocRef = doc(db, 'bets', bet.id);

    let profit = 0;
    let bankrollChange = 0;

    if (newResult === 'green') {
      profit = bet.stake * (bet.odd - 1);
      bankrollChange = bet.stake * bet.odd;
    } else if (newResult === 'red') {
      profit = -bet.stake;
      bankrollChange = 0;
    } else if (newResult === 'reembolso') {
      profit = 0;
      bankrollChange = bet.stake;
    }

    batch.update(betDocRef, { result: newResult, profit: profit });

    if (bankrollChange > 0) {
      batch.update(userDocRef, { currentBankroll: increment(bankrollChange) });
    }

    await batch.commit();
  };

  const deleteBet = async (betToDelete: Bet) => {
    if (!user) throw new Error("Utilizador não autenticado.");

    const batch = writeBatch(db);
    const userDocRef = doc(db, 'users', user.uid);
    const betDocRef = doc(db, 'bets', betToDelete.id);

    let bankrollAdjustment = 0;
    if (betToDelete.result === 'green') {
      bankrollAdjustment = -betToDelete.profit;
    } else if (betToDelete.result === 'red' || betToDelete.result === 'pending') {
      bankrollAdjustment = betToDelete.stake;
    }

    if (bankrollAdjustment !== 0) {
        batch.update(userDocRef, { currentBankroll: increment(bankrollAdjustment) });
    }

    batch.delete(betDocRef);

    await batch.commit();
  };

  const updateBet = async (betId: string, updatedData: Partial<Bet>) => {
    if (!user) throw new Error("Utilizador não autenticado.");

    const batch = writeBatch(db);
    const userDocRef = doc(db, 'users', user.uid);
    const betDocRef = doc(db, 'bets', betId);

    const originalBetDoc = await getDoc(betDocRef);
    if (!originalBetDoc.exists()) {
      throw new Error("Aposta original não encontrada.");
    }
    const originalBet = originalBetDoc.data() as Bet;

    let bankrollReversal = 0;
    if (originalBet.result === 'green') {
      bankrollReversal = -originalBet.profit;
    } else if (originalBet.result === 'red' || originalBet.result === 'pending') {
      bankrollReversal = originalBet.stake;
    }

    const newStake = updatedData.stake ?? originalBet.stake;
    const newOdd = updatedData.odd ?? originalBet.odd;
    const newResult = updatedData.result ?? originalBet.result;
    
    let newProfit = 0;
    let newBankrollImpact = 0;

    if (newResult === 'green') {
      newProfit = newStake * (newOdd - 1);
      newBankrollImpact = newStake * newOdd;
    } else if (newResult === 'red') {
      newProfit = -newStake;
      newBankrollImpact = 0;
    } else if (newResult === 'reembolso') {
      newProfit = 0;
      newBankrollImpact = newStake;
    } else { // 'pending'
      newProfit = 0;
      newBankrollImpact = originalBet.stake - newStake;
    }

    const totalBankrollChange = bankrollReversal + newBankrollImpact - (originalBet.result === 'pending' ? 0 : originalBet.stake);
    
    batch.update(userDocRef, { currentBankroll: increment(totalBankrollChange) });
    batch.update(betDocRef, { ...updatedData, profit: newProfit });

    await batch.commit();
  };

  return { 
    historyItems,
    loading,
    addBet,
    updateBetStatus,
    deleteBet,
    updateBet
  };
};
