// Caminho: src/components/Bankroll.tsx

import React, { useState } from 'react';
import { DollarSign, ArrowUpRight, Plus, Minus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Bankroll: React.FC = () => {
  const { user, updateBankroll } = useAuth();
  const [amount, setAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdrawal'>('deposit');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  
  const initialBankroll = user?.initialBankroll || 0;
  const growth = initialBankroll > 0 ? ((user?.currentBankroll || 0) - initialBankroll) / initialBankroll * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount.replace(',', '.'));

    if (isNaN(numericAmount) || numericAmount <= 0) {
      setMessage({ type: 'error', text: 'Por favor, insira um valor válido.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await updateBankroll(numericAmount, activeTab);
      setMessage({ type: 'success', text: `${activeTab === 'deposit' ? 'Depósito' : 'Saque'} realizado com sucesso!` });
      setAmount(''); 
    } catch (error) {
      
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro ao processar a transação.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">Gerir Banca</h1>

      {/* Card Principal da Banca */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl p-6 relative overflow-hidden shadow-lg">
        <div className="relative z-10">
          <p className="text-sm text-blue-200 mb-2">Banca Atual</p>
          <div className="flex items-baseline gap-3">
            <p className="text-5xl font-bold">R$ {user?.currentBankroll.toFixed(2)}</p>
          </div>
          <div className="flex justify-between items-end mt-4">
            <div>
              <p className="text-xs text-blue-200">Banca Inicial</p>
              <p className="font-semibold">R$ {initialBankroll.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-200">Crescimento</p>
              <div className={`flex items-center font-semibold`}>
                <ArrowUpRight className={`w-4 h-4 mr-1 ${growth < 0 && 'transform rotate-90'}`} />
                {growth.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card de Ações */}
      {/* --- CORREÇÃO DE ESTILO: Adicionadas classes para modo claro --- */}
      <div className="bg-white dark:bg-card border border-gray-200 dark:border-card-border rounded-2xl p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button onClick={() => setActiveTab('deposit')} className={`flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-colors ${activeTab === 'deposit' ? 'bg-blue-600 dark:bg-accent-start text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-primary-text hover:bg-gray-200 dark:hover:bg-white/10'}`}>
            <Plus className="w-5 h-5" /> Depositar
          </button>
          <button onClick={() => setActiveTab('withdrawal')} className={`flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-colors ${activeTab === 'withdrawal' ? 'bg-blue-600 dark:bg-accent-start text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-primary-text hover:bg-gray-200 dark:hover:bg-white/10'}`}>
            <Minus className="w-5 h-5" /> Sacar
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-secondary-text mb-2 block">Valor para {activeTab === 'deposit' ? 'Depósito' : 'Saque'}</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-secondary-text" />
              <input type="text" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-gray-50 dark:bg-background border border-gray-300 dark:border-card-border rounded-lg py-3 pl-12 pr-4 text-gray-900 dark:text-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-accent-start" />
            </div>
          </div>
          {message && (
            <div className={`text-center text-sm p-3 mt-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400'}`}>
              {message.text}
            </div>
          )}
          <div className="mt-6">
            <button type="submit" disabled={loading} className="w-full font-bold text-lg px-8 py-3 rounded-xl text-white bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-accent-start dark:to-accent-end hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? 'A processar...' : `Confirmar ${activeTab === 'deposit' ? 'Depósito' : 'Saque'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
