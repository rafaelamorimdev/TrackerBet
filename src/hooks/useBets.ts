// Caminho: src/hooks/useBets.ts

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth'; // Precisamos do status de autenticação
import { Bet } from '../types';

export const useBets = () => {
  // Obter o status completo do utilizador, incluindo se é assinante
  const { user, isAdmin, isSubscriber } = useAuth(); 
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Determinar se o utilizador tem permissão de acesso
    const hasAccess = isAdmin || isSubscriber;

    // 2. Se não houver um utilizador logado OU se ele não tiver acesso,
    // não tentamos buscar os dados. Apenas retornamos uma lista vazia.
    if (!user || !hasAccess) {
      setBets([]);
      setLoading(false);
      return; // Interrompe a execução do hook aqui
    }

    // 3. Se o utilizador TEM acesso, então prosseguimos com a busca dos dados.
    setLoading(true);
    const q = query(
      collection(db, "bets"), 
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc") // Ordena as apostas da mais recente para a mais antiga
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userBets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bet));
      setBets(userBets);
      setLoading(false);
    }, (error) => {
      // Este erro só deve acontecer agora se houver um problema real com o Firestore
      console.error("Error fetching bets:", error);
      setLoading(false);
    });

    // Função de limpeza para parar de ouvir as atualizações quando o componente for desmontado
    return () => unsubscribe();

  // O hook será executado novamente se o status do utilizador, admin ou assinante mudar
  }, [user, isAdmin, isSubscriber]); 

  // --- NOVA FUNÇÃO ADICIONADA AQUI ---
  // Função para adicionar uma nova aposta à base de dados
  const addBet = async (betData: Omit<Bet, 'id' | 'userId' | 'createdAt' | 'result' | 'profit'>) => {
    if (!user) throw new Error("Utilizador não autenticado.");

    const newBet = {
      ...betData,
      userId: user.uid,
      createdAt: Timestamp.now(),
      result: 'pending', // Todas as apostas começam como pendentes
      profit: 0, // O lucro inicial é zero
    };

    try {
      const betsCollectionRef = collection(db, 'bets');
      await addDoc(betsCollectionRef, newBet);
    } catch (error) {
      console.error("Erro ao adicionar aposta: ", error);
      throw new Error("Não foi possível registar a aposta.");
    }
  };

  // Exporta a nova função 'addBet' juntamente com os outros estados
  return { bets, loading, addBet };
};
