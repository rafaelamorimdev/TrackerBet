

import { Timestamp } from 'firebase/firestore';

// Interface para o Utilizador
export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  initialBankroll: number;
  currentBankroll: number;
  customMarkets?: {
    futebol: string[];
    basquete: string[];
  };
  isSubscriber: boolean;
  accessUntil?: Timestamp;
  role?: 'admin';
  createdAt?: Timestamp; // Campo para o dashboard de métricas
}

// Interface para as Apostas
export interface Bet {
  id: string;
  type: 'bet';
  userId: string;
  game: string;
  market: string;
  odd: number;
  stake: number;
  result: 'green' | 'red' | 'reembolso' | 'pending';
  profit: number;
  createdAt: Date;
  sport: string;
}

// Interface para as transações de Depósito e Saque
export interface BankrollEntry {
  id: string;
  type: 'deposit' | 'withdrawal';
  userId: string;
  amount: number;
  createdAt: Date;
}

// Interface para as Subscrições (para o gráfico de receita)
export interface Subscription {
  amount: number;
  createdAt: Timestamp;
  userId: string;
}

// Tipo unificado para o histórico de apostas
export type HistoryItem = Bet | BankrollEntry;
