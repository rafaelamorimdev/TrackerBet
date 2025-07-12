import React, { useState } from 'react';
import { Plus, Calculator, AlertCircle, CheckCircle } from 'lucide-react';
import { useBets } from '../hooks/useBets';
import { useAuth } from '../hooks/useAuth';


export const AddBet: React.FC = () => {
  const { addBet } = useBets();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    game: '',
    market: '',
    odd: '',
    stake: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setMessage({ type: 'error', text: 'Utilizador não encontrado. Por favor, faça login novamente.' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      await addBet({
        game: formData.game,
        market: formData.market,
        odd: parseFloat(formData.odd),
        stake: parseFloat(formData.stake)
      });

      setMessage({ type: 'success', text: 'Aposta adicionada com sucesso! Estado: Pendente' });
      setFormData({ game: '', market: '', odd: '', stake: '' });
    } catch (error) {
      const errorText = error instanceof Error ? error.message : 'Erro ao adicionar aposta. Tente novamente.';
      setMessage({ type: 'error', text: errorText });
    } finally {
      setLoading(false);
    }
  };

  const calculatePotentialReturn = () => {
    const odd = parseFloat(formData.odd) || 0;
    const stake = parseFloat(formData.stake) || 0;
    return stake * odd;
  };

  const calculatePotentialProfit = () => {
    const stake = parseFloat(formData.stake) || 0;
    const potentialReturn = calculatePotentialReturn();
    return potentialReturn - stake;
  };

  const commonMarkets = [
    'Vitória', 'Empate', 'Ambas Marcam', 'Over gols', 'Under gols',
    'Handicap', 'Cantos', 'Cartões', 'Golos 1ª Parte', 'Desarmes', 'BINGO', 'laterais', 'metas', 'faltas', 'finalizações'
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-6">
          <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nova Aposta</h1>
        </div>

        {message && (
          <div className={`flex items-center p-3 mb-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="game" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Jogo</label>
            <input type="text" id="game" required value={formData.game} onChange={(e) => setFormData({ ...formData, game: e.target.value })} placeholder="Ex: Real Madrid vs Juventus" className="w-full px-4 py-3 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white" />
          </div>

          <div>
            <label htmlFor="market" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mercado</label>
            <select id="market" required value={formData.market} onChange={(e) => setFormData({ ...formData, market: e.target.value })} className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white">
              <option value="">Selecione o mercado</option>
              {commonMarkets.map((market) => (<option key={market} value={market}>{market}</option>))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="odd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Odd</label>
              <input type="number" id="odd" required step="0.01" min="1" value={formData.odd} onChange={(e) => setFormData({ ...formData, odd: e.target.value })} placeholder="Ex: 1.72" className="w-full px-4 py-3 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white" />
            </div>
            <div>
              <label htmlFor="stake" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Stake (R$)</label>
              <input type="number" id="stake" required step="0.01" min="0.01" value={formData.stake} onChange={(e) => setFormData({ ...formData, stake: e.target.value })} placeholder="Ex: 20.00" className="w-full px-4 py-3 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white" />
            </div>
          </div>

          {formData.odd && formData.stake && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Calculator className="w-5 h-5 text-gray-600 dark:text-gray-300 mr-2" />
                <h3 className="font-medium text-gray-900 dark:text-white">Cálculo Potencial</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Retorno em caso de Green:</span>
                  <span className="font-medium dark:text-white">R$ {calculatePotentialReturn().toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 dark:border-gray-600">
                  <span className="text-gray-600 dark:text-gray-300">Lucro Potencial:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">R$ {calculatePotentialProfit().toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {loading ? 'A Adicionar...' : 'Adicionar Aposta'}
          </button>
        </form>
      </div>
    </div>
  );
};
