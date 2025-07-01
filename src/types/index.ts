// Definição para uma única aposta
export interface Bet {
  id: string;
  userId: string;
  game: string;
  market: string;
  odd: number;
  stake: number;
  result: 'green' | 'red' | 'reembolso' | 'pending';
  profit: number;
  createdAt: Date;
}

// Definição para uma entrada no histórico da banca
export interface BankrollEntry {
  id: string;
  userId: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'bet' | 'win';
  description: string;
  createdAt: Date;
}

// Definição para o objeto do utilizador
export interface User {
  uid: string;
  email: string;
  // CORREÇÃO: As propriedades agora aceitam 'null' em vez de 'undefined'
  displayName: string | null;
  photoURL: string | null;
  initialBankroll: number;
  currentBankroll: number;
}
