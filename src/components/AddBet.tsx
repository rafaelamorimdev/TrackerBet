// Caminho: src/components/AddBet.tsx

import React, { useState } from 'react';
import { Plus, Repeat } from 'lucide-react';
import { useBets } from '../hooks/useBets';
import { useAuth } from '../hooks/useAuth';

// Interface para os dados do formulário
interface FormData {
  game: string;
  market: string;
  odd: string;
  stake: string;
}

export const AddBet: React.FC = () => {
  // --- CORREÇÃO: Obter a lista de apostas do hook ---
  const { addBet, bets } = useBets();
  const { user } = useAuth();
  const [activeSport, setActiveSport] = useState('futebol');
  const [formData, setFormData] = useState<FormData>({ game: '', market: '', odd: '', stake: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // --- LISTAS DE MERCADOS SEPARADAS POR DESPORTO ---
  const futebolMarketOptions = [
    'Vencedor',
    'Empate',
    'Dupla Hipótese',
    'Ambas as Equipas Marcam',
    'Total de Golos (Mais/Menos)',
    'Handicap Asiático',
    'Total de Cantos (Mais/Menos)',
    'Total de Cartões (Mais/Menos)',
    'Finalizações (Mais/Menos)',
    'Desarmes (Mais/Menos)',
    'Bingo',
    'Cartão Jogador',
    'Gol Jogador',
    'Passes',
  ];

  const basqueteMarketOptions = [
    'Vencedor da Partida (Moneyline)',
    'Handicap de Pontos',
    'Total de Pontos (Mais/Menos)',
    'Pontos do Jogador (Mais/Menos)',
    'Assistências do Jogador (Mais/Menos)',
    'Ressaltos do Jogador (Mais/Menos)',
  ];

  // Escolhe a lista de mercados com base no desporto ativo
  const marketOptions = activeSport === 'futebol' ? futebolMarketOptions : basqueteMarketOptions;

  // Função para lidar com as mudanças nos campos do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      setFormData({ game: '', market: '', odd: '', stake: '' }); // Limpa o formulário
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Não foi possível adicionar a aposta.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // --- NOVA FUNÇÃO PARA REPETIR A ÚLTIMA APOSTA ---
  const handleRepeatLastBet = () => {
    // Verifica se existe alguma aposta no histórico
    if (bets && bets.length > 0) {
      // A lista já vem ordenada da mais recente para a mais antiga do hook useBets
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
          {/* --- BOTÃO AGORA FUNCIONAL --- */}
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
            {/* --- CORREÇÃO APLICADA AQUI --- */}
            <input 
              name="game" 
              value={formData.game} 
              onChange={handleChange} 
              type="text"  
              placeholder={activeSport === 'futebol' ? "Ex: Real Madrid vs Juventus" : "Ex: Lakers vs Warriors"}
              className="w-full bg-background border border-card-border rounded-lg py-3 px-4 text-primary-text focus:outline-none focus:ring-2 focus:ring-accent-start" 
            />
          </div>
          <div>
            <label className="text-sm font-medium text-secondary-text mb-2 block">Mercado</label>
            <select name="market" value={formData.market} onChange={handleChange} className="w-full bg-background border border-card-border rounded-lg py-3 px-4 text-primary-text focus:outline-none focus:ring-2 focus:ring-accent-start">
              <option value="">Selecione o mercado</option>
            
              {marketOptions.map(market => (
                <option key={market} value={market}>
                  {market}
                </option>
              ))}
            </select>
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
