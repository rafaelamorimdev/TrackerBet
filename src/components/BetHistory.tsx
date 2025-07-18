// Caminho: src/components/BetHistory.tsx

import React, { useState, useMemo } from 'react';
import { Search, CheckCircle, XCircle, RefreshCw, Edit, Trash2 } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { useBets } from '../hooks/useBets';
import { Bet } from '../types';

export const BetHistory: React.FC = () => {
  const { bets, loading, updateBetStatus } = useBets();
  const [error, setError] = useState<string | null>(null);

  // --- ESTADOS PARA OS FILTROS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleUpdateStatus = async (bet: Bet, newResult: 'green' | 'red' | 'anulada') => {
    setError(null);
    try {
      await updateBetStatus(bet, newResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar aposta.';
      setError(errorMessage);
      setTimeout(() => setError(null), 3000);
    }
  };

  const formatDate = (timestamp: unknown) => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toLocaleDateString('pt-BR');
    }
    return 'Data inválida';
  };

  // --- LÓGICA PARA FILTRAR AS APOSTAS ---
  const filteredBets = useMemo(() => {
    return bets.filter(bet => {
      const searchMatch = bet.game.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === 'all' || bet.result === statusFilter;
      return searchMatch && statusMatch;
    });
  }, [bets, searchTerm, statusFilter]);

  const totalProfit = filteredBets.reduce((acc, bet) => acc + bet.profit, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">Histórico de Apostas</h1>
        <div className="bg-card border border-card-border rounded-lg px-4 py-2 text-sm">
          <span className="text-secondary-text mr-2">Lucro do Período:</span>
          <span className={`font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            R$ {totalProfit.toFixed(2)}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 text-red-400 p-3 rounded-lg text-center text-sm">
          {error}
        </div>
      )}

      {/* --- BARRA DE FILTROS REINTRODUZIDA E FUNCIONAL --- */}
      <div className="bg-card border border-card-border rounded-xl p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-text" />
          <input
            type="text"
            placeholder="Buscar por jogo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-background border border-card-border rounded-lg py-2.5 pl-10 pr-4 text-primary-text focus:outline-none focus:ring-2 focus:ring-accent-start"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-48 bg-background border border-card-border rounded-lg py-2.5 px-4 text-primary-text focus:outline-none focus:ring-2 focus:ring-accent-start"
        >
          <option value="all">Todos os Status</option>
          <option value="pending">Pendentes</option>
          <option value="green">Green</option>
          <option value="red">Red</option>
          <option value="anulada">Anuladas</option>
        </select>
        {/* Adicione outros filtros se necessário */}
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Jogo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Mercado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Odd</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Stake</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Resultado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-secondary-text">A carregar apostas...</td></tr>
            ) : filteredBets.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-secondary-text">Nenhuma aposta encontrada para os filtros selecionados.</td></tr>
            ) : (
              filteredBets.map(bet => (
                <tr key={bet.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-text">{formatDate(bet.createdAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-text">{bet.game}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-text">{bet.market}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-text">{bet.odd.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-text">R$ {bet.stake.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {bet.result === 'pending' ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateStatus(bet, 'green')} className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-full"><CheckCircle className="w-5 h-5" /></button>
                        <button onClick={() => handleUpdateStatus(bet, 'red')} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-full"><XCircle className="w-5 h-5" /></button>
                        <button onClick={() => handleUpdateStatus(bet, 'anulada')} className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-full"><RefreshCw className="w-5 h-5" /></button>
                      </div>
                    ) : (
                      <span className={`capitalize px-2 py-1 text-xs font-semibold rounded-full ${
                        bet.result === 'green' ? 'bg-green-900/50 text-green-400' : 
                        bet.result === 'red' ? 'bg-red-900/50 text-red-400' : 
                        'bg-blue-900/50 text-blue-400'
                      }`}>
                        {bet.result}
                      </span>
                    )}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${bet.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>R$ {bet.profit.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button className="text-secondary-text hover:text-primary-text"><Edit className="w-4 h-4" /></button>
                      <button className="text-secondary-text hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
