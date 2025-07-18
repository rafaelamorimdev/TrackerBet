// Caminho: src/components/AddBet.tsx

import React, { useState, useMemo } from 'react';
import { Plus, Repeat, Check, X } from 'lucide-react';
import { useBets } from '../hooks/useBets';
import { useAuth } from '../hooks/useAuth';

interface FormData {
  game: string;
  market: string;
  odd: string;
  stake: string;
}

export const AddBet: React.FC = () => {
  const { addBet, bets } = useBets();
  const { user, addCustomMarket } = useAuth(); // Obter a nova função
  const [activeSport, setActiveSport] = useState<'futebol' | 'basquete'>('futebol');
  const [formData, setFormData] = useState<FormData>({ game: '', market: '', odd: '', stake: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [isAddingMarket, setIsAddingMarket] = useState(false);
  const [newMarketName, setNewMarketName] = useState('');
  const [addMarketLoading, setAddMarketLoading] = useState(false);

  const futebolMarketOptions = [
    'Vencedor', 'Empate', 'Dupla Hipótese', 'Ambas as Equipas Marcam', 
    'Total de Golos (Mais/Menos)', 'Handicap Asiático', 'Total de Cantos (Mais/Menos)', 
    'Total de Cartões (Mais/Menos)', 'Finalizações (Mais/Menos)', 'Desarmes (Mais/Menos)', 
    'Bingo', 'Cartão Jogador', 'Gol Jogador', 'Passes'
  ];
  const basqueteMarketOptions = [
    'Vencedor da Partida (Moneyline)', 'Handicap de Pontos', 'Total de Pontos (Mais/Menos)', 
    'Pontos do Jogador (Mais/Menos)', 'Assistências do Jogador (Mais/Menos)', 'Ressaltos do Jogador (Mais/Menos)'
  ];
  
  const marketOptions = useMemo(() => {
    const defaultOptions = activeSport === 'futebol' ? futebolMarketOptions : basqueteMarketOptions;
    const customOptions = user?.customMarkets?.[activeSport] || [];
    return [...new Set([...defaultOptions, ...customOptions])];
  }, [activeSport, user?.customMarkets]);

  const handleSaveNewMarket = async () => {
    if (!newMarketName.trim()) return;
    setAddMarketLoading(true);
    try {
      await addCustomMarket(activeSport, newMarketName);
      setNewMarketName('');
      setIsAddingMarket(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao guardar mercado.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setAddMarketLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMessage(null);

    try {
      const betData = {
        game: formData.game,
        market: formData.market,
        odd: parseFloat(formData.odd.replace(',', '.')),
        stake: parseFloat(formData.stake.replace(',', '.'))
      };

      if (isNaN(betData.odd) || isNaN(betData.stake)) {
        throw new Error("Odd e Stake devem ser números válidos.");
      }

      await addBet(betData);
      setMessage({ type: 'success', text: 'Aposta adicionada com sucesso!' });
      setFormData({ game: '', market: '', odd: '', stake: '' });
    } catch (error) {
      // --- CORREÇÃO APLICADA AQUI ---
      const errorMessage = error instanceof Error ? error.message : 'Não foi possível adicionar a aposta.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };
  
  const handleRepeatLastBet = () => {
    if (bets && bets.length > 0) {
      const lastBet = bets[0];
      setFormData({
        game: lastBet.game,
        market: lastBet.market,
        odd: String(lastBet.odd),
        stake: String(lastBet.stake),
      });
      setMessage({ type: 'success', text: 'Última aposta carregada!' });
    } else {
      setMessage({ type: 'error', text: 'Nenhuma aposta anterior encontrada.' });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card border border-card-border rounded-2xl p-8 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-start/20 rounded-lg">
              <Plus className="w-6 h-6 text-accent-start" />
            </div>
            <h1 className="text-2xl font-bold text-primary-text">Nova Aposta</h1>
          </div>
          <button onClick={handleRepeatLastBet} className="flex items-center text-sm text-secondary-text hover:text-primary-text transition-colors">
            <Repeat className="w-4 h-4 mr-2" />
            Repetir Última
          </button>
        </div>

        <div className="flex border-b border-card-border mb-6">
          <button onClick={() => setActiveSport('futebol')} className={`px-4 py-3 font-semibold transition-colors ${activeSport === 'futebol' ? 'text-primary-text border-b-2 border-accent-start' : 'text-secondary-text'}`}>
            Futebol
          </button>
          <button onClick={() => setActiveSport('basquete')} className={`px-4 py-3 font-semibold transition-colors ${activeSport === 'basquete' ? 'text-primary-text border-b-2 border-accent-start' : 'text-secondary-text'}`}>
            Basquete
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-secondary-text mb-2 block">Jogo</label>
            <input name="game" value={formData.game} onChange={handleChange} type="text" placeholder={activeSport === 'futebol' ? "Ex: Real Madrid vs Juventus" : "Ex: Lakers vs Warriors"} className="w-full bg-background border border-card-border rounded-lg py-3 px-4 text-primary-text focus:outline-none focus:ring-2 focus:ring-accent-start" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-secondary-text">Mercado</label>
              {!isAddingMarket && (
                <button type="button" onClick={() => setIsAddingMarket(true)} className="text-xs text-accent-start font-semibold hover:underline">
                  + Adicionar Novo
                </button>
              )}
            </div>

            {isAddingMarket ? (
              <div className="flex gap-2">
                <input
                  value={newMarketName}
                  onChange={(e) => setNewMarketName(e.target.value)}
                  type="text"
                  placeholder="Nome do novo mercado"
                  className="flex-grow bg-background border border-card-border rounded-lg py-3 px-4 text-primary-text focus:outline-none focus:ring-2 focus:ring-accent-start"
                />
                <button type="button" onClick={handleSaveNewMarket} disabled={addMarketLoading} className="p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50">
                  {addMarketLoading ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : <Check className="w-5 h-5" />}
                </button>
                <button type="button" onClick={() => setIsAddingMarket(false)} className="p-3 bg-red-500 text-white rounded-lg hover:bg-red-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <select name="market" value={formData.market} onChange={handleChange} className="w-full bg-background border border-card-border rounded-lg py-3 px-4 text-primary-text focus:outline-none focus:ring-2 focus:ring-accent-start">
                <option value="">Selecione o mercado</option>
                {marketOptions.map(market => (
                  <option key={market} value={market}>{market}</option>
                ))}
              </select>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-secondary-text mb-2 block">Odd</label>
              <input name="odd" value={formData.odd} onChange={handleChange} type="text" placeholder="Ex: 1.72" className="w-full bg-background border border-card-border rounded-lg py-3 px-4 text-primary-text focus:outline-none focus:ring-2 focus:ring-accent-start" />
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text mb-2 block">Stake (R$)</label>
              <input name="stake" value={formData.stake} onChange={handleChange} type="text" placeholder="Ex: 20.00" className="w-full bg-background border border-card-border rounded-lg py-3 px-4 text-primary-text focus:outline-none focus:ring-2 focus:ring-accent-start" />
            </div>
          </div>

          {message && (
            <div className={`text-center text-sm p-3 rounded-lg ${message.type === 'success' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
              {message.text}
            </div>
          )}

          <div className="pt-2">
            <button type="submit" disabled={loading} className="w-full font-bold text-lg px-8 py-3 rounded-xl text-white bg-gradient-to-r from-accent-start to-accent-end hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? 'A adicionar...' : 'Adicionar Aposta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
