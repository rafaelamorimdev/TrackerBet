import React, { useState } from 'react';
import { Plus, Calculator, AlertCircle, CheckCircle, Repeat, Zap } from 'lucide-react';
import { useBets } from '../hooks/useBets';
import { useAuth } from '../hooks/useAuth';
// CORREÇÃO: Importando o componente do ícone do seu próprio ficheiro.
// Note a ausência de chavetas {} porque estamos a usar 'export default'.
import IconSoccerBall from '../img/SoccerBall'; // Ajuste o caminho se necessário.

export const AddBet: React.FC = () => {
  const { addBet, bets } = useBets();
  const { user } = useAuth();
  
  const [selectedSport, setSelectedSport] = useState('futebol');

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
        stake: parseFloat(formData.stake),
        sport: selectedSport 
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

  const handleRepeatLastBet = () => {
    if (bets && bets.length > 0) {
      const lastBet = bets[0];
      setSelectedSport(lastBet.sport || 'futebol');
      setFormData({
        game: lastBet.game,
        market: lastBet.market,
        odd: String(lastBet.odd),
        stake: String(lastBet.stake),
      });
      setMessage({ type: 'success', text: 'Dados da última aposta preenchidos.' });
    } else {
      setMessage({ type: 'error', text: 'Nenhuma aposta anterior encontrada no histórico.' });
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

  const footballMarkets = [
    'Vitória', 'Empate', 'Ambas Marcam', 'Over gols', 'Under gols',
    'Handicap', 'Cantos', 'Cartões', 'Golos 1ª Parte', 'Desarmes', 'BINGO', 'laterais', 'metas', 'faltas', 'finalizações'
  ];

  const basketballMarkets = [
    'Total de pontos', 'Vitória', 'BINGO', 'Handicap', 'Cesta de 3', 
    'Roubos', 'Assistencias', 'Rebotes', 'Pontos', 'Over pontos', 'Under pontos'
  ];

  const activeMarkets = selectedSport === 'futebol' ? footballMarkets : basketballMarkets;

  const gamePlaceholder = selectedSport === 'futebol' 
    ? "Ex: Real Madrid vs Juventus" 
    : "Ex: Lakers vs Warriors";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nova Aposta</h1>
          </div>
          <button
            type="button"
            onClick={handleRepeatLastBet}
            disabled={!bets || bets.length === 0}
            className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900 transition-colors"
          >
            <Repeat className="w-4 h-4 mr-2" />
            Repetir Última
          </button>
        </div>

        <div className="mb-6 flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setSelectedSport('futebol')}
            className={`flex items-center justify-center px-4 py-3 -mb-px text-sm font-medium transition-colors duration-200 ease-in-out ${selectedSport === 'futebol' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
          >
            <IconSoccerBall />
            Futebol
          </button>
          <button
            onClick={() => setSelectedSport('basquete')}
            className={`flex items-center justify-center px-4 py-3 -mb-px text-sm font-medium transition-colors duration-200 ease-in-out ${selectedSport === 'basquete' ? 'border-b-2 border-orange-500 text-orange-600 dark:text-orange-400' : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
          >
            <Zap className="w-5 h-5 mr-2" />
            Basquete
          </button>
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
            <input type="text" id="game" required value={formData.game} onChange={(e) => setFormData({ ...formData, game: e.target.value })} placeholder={gamePlaceholder} className="w-full px-4 py-3 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white" />
          </div>

          <div>
            <label htmlFor="market" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mercado</label>
            <select id="market" required value={formData.market} onChange={(e) => setFormData({ ...formData, market: e.target.value })} className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white">
              <option value="">Selecione o mercado</option>
              {activeMarkets.map((market) => (<option key={market} value={market}>{market}</option>))}
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
