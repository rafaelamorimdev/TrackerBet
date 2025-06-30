import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Minus, DollarSign, TrendingUp, AlertCircle, CheckCircle, ArrowRight, Edit } from 'lucide-react';
import { useBets } from '../hooks/useBets';
import { useAuth } from '../hooks/useAuth';

const InitialBankrollSetup: React.FC<{ onSetup: (amount: number) => Promise<void>; }> = ({ onSetup }) => {
  const [initialAmount, setInitialAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSetup = async () => {
    const amount = parseFloat(initialAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Por favor, insira um valor positivo para a banca inicial.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSetup(amount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
      <div className="max-w-md w-full mx-auto text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md border dark:border-gray-700">
        <Wallet className="w-12 h-12 mx-auto text-blue-600 dark:text-blue-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Definir Banca Inicial</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Este será o ponto de partida para todos os seus cálculos.</p>
        {error && <p className="mb-4 text-sm text-red-600 bg-red-100 p-3 rounded-lg">{error}</p>}
        <div className="relative mb-4">
          <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input type="number" value={initialAmount} onChange={(e) => setInitialAmount(e.target.value)} placeholder="1000.00" className="w-full text-center text-lg font-medium pl-12 pr-4 py-3 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white" />
        </div>
        <button onClick={handleSetup} disabled={loading || !initialAmount} className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center disabled:opacity-50 transition-colors">
          {loading ? 'A definir...' : 'Confirmar e Iniciar'}
          {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
        </button>
      </div>
    </div>
  );
};

export const Bankroll: React.FC = () => {
  const { user } = useAuth();
  const { setInitialBankroll, resetBankroll, updateBankroll } = useBets();
  
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDeposit, setIsDeposit] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);
  
  const handleTransaction = async () => {
    if (!amount || !user) return;
    const transactionAmount = parseFloat(amount);
    if (transactionAmount <= 0) {
      setMessage({ type: 'error', text: 'O valor deve ser positivo.' });
      return;
    }
    if (!isDeposit && transactionAmount > user.currentBankroll) {
      setMessage({ type: 'error', text: 'Saldo insuficiente para saque.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const type = isDeposit ? 'deposit' : 'withdrawal';
      await updateBankroll(transactionAmount, type);
      setMessage({ type: 'success', text: `Operação de R$ ${amount} realizada com sucesso!` });
      setAmount('');
    } catch (error) {
      const errorText = error instanceof Error ? error.message : `Erro ao realizar ${isDeposit ? 'depósito' : 'saque'}.`;
      setMessage({ type: 'error', text: errorText });
    } finally {
      setLoading(false);
    }
  };

  const handleResetBankroll = async () => {
    const confirmation = window.confirm("Tem a certeza? Esta ação irá apagar TODO o seu histórico de apostas e reiniciar a sua banca. Esta ação não pode ser desfeita.");
    if (!confirmation) return;

    const newAmountStr = window.prompt("Por favor, insira o novo valor da banca inicial:");
    if (!newAmountStr) return;
    
    const newAmount = parseFloat(newAmountStr);
    if (isNaN(newAmount) || newAmount <= 0) {
        alert("Valor inválido. Por favor, insira um número positivo.");
        return;
    }

    setLoading(true);
    try {
        await resetBankroll(newAmount);
        setMessage({ type: 'success', text: 'A sua banca foi reiniciada com sucesso!' });
    } catch {
        setMessage({ type: 'error', text: 'Erro ao reiniciar a banca.'});
    } finally {
        setLoading(false);
    }
  };

  if (!user || user.initialBankroll === 0) {
    return <InitialBankrollSetup onSetup={setInitialBankroll} />;
  }

  const bankrollGrowth = user.initialBankroll > 0 ? (((user.currentBankroll) - user.initialBankroll) / user.initialBankroll) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gerir Banca</h1>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg text-white p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center mb-2"><Wallet className="w-6 h-6 mr-3" /><h2 className="text-lg font-semibold text-blue-100">Banca Atual</h2></div>
            <p className="text-4xl md:text-5xl font-bold">R$ {user.currentBankroll.toFixed(2)}</p>
          </div>
          <div className="w-full md:w-auto flex justify-between md:justify-start md:flex-col md:text-right gap-4 mt-4 md:mt-0">
            <div>
                <div className="flex items-center justify-end gap-2"><p className="text-blue-200 text-sm">Banca Inicial</p><button onClick={handleResetBankroll} className="text-blue-300 hover:text-white transition-colors" title="Editar Banca Inicial"><Edit className="w-4 h-4" /></button></div>
              <p className="text-xl font-semibold">R$ {user.initialBankroll.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-blue-200 text-sm">Crescimento</p>
              <p className={`flex items-center justify-end text-xl font-semibold ${bankrollGrowth >= 0 ? 'text-green-300' : 'text-red-300'}`}><TrendingUp className="w-5 h-5 mr-1" />{bankrollGrowth >= 0 ? '+' : ''}{bankrollGrowth.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex border-b mb-6 dark:border-gray-700">
          <button onClick={() => setIsDeposit(true)} className={`flex-1 py-3 text-center font-medium transition-all ${isDeposit ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}><div className="flex items-center justify-center"><Plus className="w-5 h-5 mr-2" />Depositar</div></button>
          <button onClick={() => setIsDeposit(false)} className={`flex-1 py-3 text-center font-medium transition-all ${!isDeposit ? 'border-b-2 border-red-600 text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}><div className="flex items-center justify-center"><Minus className="w-5 h-5 mr-2" />Sacar</div></button>
        </div>
        
        <div className="space-y-4">
          {message && <div className={`flex items-center p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}{message.text}</div>}

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Valor para {isDeposit ? 'Depósito' : 'Saque'}</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input type="number" id="amount" step="0.01" min="0.01" max={!isDeposit ? user.currentBankroll : undefined} value={amount} onChange={(e) => { setAmount(e.target.value); if (message) setMessage(null); }} placeholder="0.00" className={`w-full pl-10 pr-4 py-3 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent text-gray-900 dark:text-white ${isDeposit ? 'focus:ring-blue-500' : 'focus:ring-red-500'}`} />
            </div>
            {!isDeposit && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Saldo disponível: R$ {user.currentBankroll.toFixed(2)}</p>}
          </div>
          
          <button onClick={handleTransaction} disabled={loading || !amount} className={`w-full text-white py-3 px-4 rounded-lg font-medium transition-colors focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${isDeposit ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'}`}>
            {loading ? 'A processar...' : (isDeposit ? 'Confirmar Depósito' : 'Confirmar Saque')}
          </button>
        </div>
      </div>
    </div>
  );
};
