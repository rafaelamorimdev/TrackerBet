import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, query, where, runTransaction, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Bet } from '../types';
import { useAuth } from './useAuth';

export const useBets = () => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setBets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, 'bets'), where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const betsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Bet[];
      
      betsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setBets(betsData);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao obter apostas:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addBet = async (betData: Omit<Bet, 'id' | 'createdAt' | 'profit' | 'result' | 'userId'>) => {
    if (!user) throw new Error("Utilizador não autenticado.");

    const userDocRef = doc(db, 'users', user.uid);
    const newBetRef = doc(collection(db, 'bets'));

    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists()) throw "Documento do utilizador não encontrado.";

      const currentBankroll = userDoc.data().currentBankroll;
      const newCurrentBankroll = currentBankroll - betData.stake;

      const newBet: Omit<Bet, 'id'> = {
        ...betData,
        userId: user.uid,
        result: 'pending',
        profit: 0,
        createdAt: new Date()
      };
      
      transaction.set(newBetRef, newBet);
      transaction.update(userDocRef, { currentBankroll: newCurrentBankroll });
    });
  };

  const updateBetResult = async (betId: string, result: 'green' | 'red' | 'reembolso') => {
    if (!user) throw new Error("Utilizador não autenticado.");
    
    const betRef = doc(db, 'bets', betId);
    const userDocRef = doc(db, 'users', user.uid);
    
    await runTransaction(db, async (transaction) => {
      const betDoc = await transaction.get(betRef);
      const userDoc = await transaction.get(userDocRef);
      if (!betDoc.exists() || !userDoc.exists()) throw "Aposta ou utilizador não encontrado.";

      const bet = betDoc.data() as Bet;
      const currentBankroll = userDoc.data().currentBankroll;
      let profit = 0;
      let bankrollAdjustment = 0;

      switch (result) {
        case 'green':
          profit = (bet.stake * bet.odd) - bet.stake;
          bankrollAdjustment = bet.stake * bet.odd;
          break;
        case 'red':
          profit = -bet.stake;
          bankrollAdjustment = 0;
          break;
        case 'reembolso':
          profit = 0;
          bankrollAdjustment = bet.stake;
          break;
      }

      transaction.update(betRef, { result, profit });
      transaction.update(userDocRef, { currentBankroll: currentBankroll + bankrollAdjustment });
    });
  };

  const updateBet = async (betId: string, updates: Partial<Omit<Bet, 'id' | 'userId' | 'createdAt'>>) => {
     if (!user) throw new Error("Utilizador não autenticado.");
    
     const betRef = doc(db, 'bets', betId);
     const userDocRef = doc(db, 'users', user.uid);

     await runTransaction(db, async (transaction) => {
        const betDoc = await transaction.get(betRef);
        const userDoc = await transaction.get(userDocRef);
        if (!betDoc.exists() || !userDoc.exists()) throw "Aposta ou utilizador não encontrado.";

        const originalBet = betDoc.data() as Bet;
        const currentBankroll = userDoc.data().currentBankroll;

        if (originalBet.result === 'pending' && updates.stake !== undefined && updates.stake !== originalBet.stake) {
            const stakeDifference = updates.stake - originalBet.stake;
            const newBankroll = currentBankroll - stakeDifference;
            transaction.update(userDocRef, { currentBankroll: newBankroll });
        }
        transaction.update(betRef, updates);
     });
  };

  const deleteBet = async (betId: string) => {
    if (!user) throw new Error("Utilizador não autenticado.");

    const betRef = doc(db, 'bets', betId);
    const userDocRef = doc(db, 'users', user.uid);

    await runTransaction(db, async (transaction) => {
        const betDoc = await transaction.get(betRef);
        const userDoc = await transaction.get(userDocRef);
        if (!betDoc.exists() || !userDoc.exists()) {
            throw "Aposta ou utilizador não encontrado.";
        }

        const bet = betDoc.data() as Bet;
        const currentBankroll = userDoc.data().currentBankroll;
        let bankrollAdjustment = 0;

        // Para anular o efeito de uma aposta, revertemos o seu impacto líquido na banca.
        if (bet.result === 'pending') {
            // Se a aposta está pendente, a stake foi deduzida mas nenhum resultado foi aplicado.
            // Para anular, simplesmente devolvemos a stake.
            bankrollAdjustment = bet.stake;
        } else {
            // Se a aposta foi resolvida, o seu lucro (positivo ou negativo) já foi aplicado à banca.
            // Para anular completamente, temos de subtrair esse lucro.
            // Ex: Lucro de +50 (green) -> subtrai 50.
            // Ex: Lucro de -20 (red) -> subtrai -20 (que é o mesmo que somar 20).
            bankrollAdjustment = -bet.profit;
        }

        transaction.delete(betRef);
        if (bankrollAdjustment !== 0) {
            transaction.update(userDocRef, { currentBankroll: currentBankroll + bankrollAdjustment });
        }
    });
  };
  
  const setInitialBankroll = async (amount: number) => {
    if (!user) throw new Error("Utilizador não autenticado.");
    if (amount <= 0) throw new Error("O valor da banca inicial deve ser positivo.");

    const userDocRef = doc(db, 'users', user.uid);
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists()) throw "Documento do utilizador não encontrado.";
      if (userDoc.data().initialBankroll > 0) throw "A banca inicial já foi definida.";
      
      transaction.update(userDocRef, { 
        initialBankroll: amount,
        currentBankroll: amount 
      });
    });
  };

  const resetBankroll = async (newInitialAmount: number) => {
    if (!user) throw new Error("Utilizador não autenticado.");
    if (newInitialAmount <= 0) throw new Error("O novo valor da banca deve ser positivo.");

    const betsQuery = query(collection(db, 'bets'), where('userId', '==', user.uid));
    const betsSnapshot = await getDocs(betsQuery);
    const batch = writeBatch(db);
    
    betsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    
    const userDocRef = doc(db, 'users', user.uid);
    batch.update(userDocRef, {
        initialBankroll: newInitialAmount,
        currentBankroll: newInitialAmount
    });
    
    await batch.commit();
  };

  const updateBankroll = async (amount: number, type: 'deposit' | 'withdrawal') => {
    if (!user) throw new Error("Utilizador não autenticado.");

    const userDocRef = doc(db, 'users', user.uid);
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists()) throw "Utilizador não encontrado.";

      const { currentBankroll } = userDoc.data();
      let newCurrentBankroll = currentBankroll;

      if (type === 'deposit') {
        newCurrentBankroll += amount;
      } else {
        if (amount > currentBankroll) throw new Error("Saldo insuficiente.");
        newCurrentBankroll -= amount;
      }
      
      transaction.update(userDocRef, { currentBankroll: newCurrentBankroll });
    });
  };

  return { 
    bets, 
    loading,
    addBet, 
    updateBetResult, 
    updateBet, 
    deleteBet,
    setInitialBankroll,
    resetBankroll,
    updateBankroll 
  };
};
