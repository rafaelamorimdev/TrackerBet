
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


export interface BankrollEntry {
  id: string;
  userId: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'bet' | 'win';
  description: string;
  createdAt: Date;
}


export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  initialBankroll: number;
  currentBankroll: number;
}
