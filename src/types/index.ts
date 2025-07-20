// Caminho: src/types/index.ts

import { Timestamp } from 'firebase/firestore';

// Interface para o Utilizador, com os campos de permissão que já implementámos
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
  role?: 'admin'; // Opcional, para identificar administradores
}

// Interface para as Apostas, com o campo 'type' para o histórico unificado
export interface Bet {
  id: string;
  type: 'bet'; // Identificador do tipo
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
  type: 'deposit' | 'withdrawal'; // Apenas os tipos que aparecem no histórico
  userId: string;
  amount: number;
  createdAt: Date;
}

// O tipo unificado que representa qualquer item no histórico
export type HistoryItem = Bet | BankrollEntry;
