

import React, { useState, useMemo, useEffect } from 'react';
import { Search, CheckCircle, XCircle, RefreshCw, Edit, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useBets } from '../hooks/useBets';
import { Bet } from '../types'; 


const EditBetModal: React.FC<{
  bet: Bet | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (betId: string, updatedData: Partial<Bet>) => Promise<void>;
}> = ({ bet, isOpen, onClose, onSave }) => {
    const [editedGame, setEditedGame] = useState('');
    const [editedOdd, setEditedOdd] = useState(0);
    const [editedStake, setEditedStake] = useState(0);
    const [editedResult, setEditedResult] = useState<Bet['result']>('pending');

    useEffect(() => {
        if (bet) {
            setEditedGame(bet.game);
            setEditedOdd(bet.odd);
            setEditedStake(bet.stake);
            setEditedResult(bet.result);
        }
    }, [bet]);

    if (!isOpen || !bet) return null;

    const handleSave = async () => {
        await onSave(bet.id, { 
            game: editedGame, 
            odd: editedOdd,
            stake: editedStake,
            result: editedResult
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-card-border rounded-xl p-6 w-full max-w-md space-y-4 animate-fade-in">
                <h2 className="text-xl font-bold text-primary-text">Editar Aposta</h2>
                <div>
                    <label className="text-sm text-secondary-text mb-1 block">Jogo</label>
                    <input type="text" value={editedGame} onChange={(e) => setEditedGame(e.target.value)} className="w-full mt-1 bg-background border border-card-border rounded-lg p-2 text-primary-text focus:outline-none focus:ring-2 focus:ring-accent-start" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-secondary-text mb-1 block">Odd</label>
                        <input type="number" value={editedOdd} onChange={(e) => setEditedOdd(parseFloat(e.target.value) || 0)} className="w-full mt-1 bg-background border border-card-border rounded-lg p-2 text-primary-text focus:outline-none focus:ring-2 focus:ring-accent-start" />
                    </div>
                    <div>
                        <label className="text-sm text-secondary-text mb-1 block">Stake</label>
                        <input type="number" value={editedStake} onChange={(e) => setEditedStake(parseFloat(e.target.value) || 0)} className="w-full mt-1 bg-background border border-card-border rounded-lg p-2 text-primary-text focus:outline-none focus:ring-2 focus:ring-accent-start" />
                    </div>
                </div>
                <div>
                    <label className="text-sm text-secondary-text mb-1 block">Status / Resultado</label>
                    <select value={editedResult} onChange={(e) => setEditedResult(e.target.value as Bet['result'])} className="w-full mt-1 bg-background border border-card-border rounded-lg p-2 text-primary-text focus:outline-none focus:ring-2 focus:ring-accent-start">
                        <option value="pending">Pendente</option>
                        <option value="green">Green</option>
                        <option value="red">Red</option>
                        <option value="reembolso">Reembolso</option>
                    </select>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-secondary-text hover:bg-white/10 transition-colors">Cancelar</button>
                    <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-accent-start text-white font-semibold hover:opacity-90 transition-opacity">Salvar Alterações</button>
                </div>
            </div>
        </div>
    );
};

export const BetHistory: React.FC = () => {
  const { historyItems, loading, updateBetStatus, deleteBet, updateBet } = useBets();
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [betToEdit, setBetToEdit] = useState<Bet | null>(null);

  const handleUpdateStatus = async (bet: Bet, newResult: 'green' | 'red' | 'reembolso') => {
    setError(null);
    try {
      await updateBetStatus(bet, newResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar aposta.';
      setError(errorMessage);
    }
  };

  const handleOpenEditModal = (bet: Bet) => {
    setBetToEdit(bet);
    setIsEditModalOpen(true);
  };

  const handleDeleteBet = async (bet: Bet) => {
    if (confirm(`Tem a certeza que quer excluir a aposta no jogo "${bet.game}"?`)) {
      try {
        await deleteBet(bet);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir aposta.';
        setError(errorMessage);
      }
    }
  };

  const formatDate = (date: Date) => {
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date.toLocaleDateString('pt-BR');
    }
    return 'Data inválida';
  };

  const filteredItems = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    return historyItems.filter(item => {
      let dateMatch = true;
      if (dateFilter === '7days') {
        dateMatch = item.createdAt >= sevenDaysAgo;
      } else if (dateFilter === '30days') {
        dateMatch = item.createdAt >= thirtyDaysAgo;
      }
      if (!dateMatch) return false;

      if (item.type !== 'bet') return true;
      
      const searchMatch = item.game.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === 'all' || item.result === statusFilter;
      return searchMatch && statusMatch;
    });
  }, [historyItems, searchTerm, statusFilter, dateFilter]);

  const totalProfit = useMemo(() => {
    return filteredItems
      .filter((item): item is Bet => item.type === 'bet')
      .reduce((acc, bet) => acc + bet.profit, 0);
  }, [filteredItems]);

  return (
    <>
      <EditBetModal bet={betToEdit} isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={updateBet} />
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
            <option value="reembolso">Reembolso</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full md:w-48 bg-background border border-card-border rounded-lg py-2.5 px-4 text-primary-text focus:outline-none focus:ring-2 focus:ring-accent-start"
          >
            <option value="all">Todo o Período</option>
            <option value="7days">Últimos 7 Dias</option>
            <option value="30days">Últimos 30 Dias</option>
          </select>
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
                <tr><td colSpan={8} className="text-center py-10 text-secondary-text">A carregar histórico...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-secondary-text">Nenhum registo encontrado.</td></tr>
              ) : (
                filteredItems.map(item => {
                  if (item.type === 'deposit' || item.type === 'withdrawal') {
                    const isDeposit = item.type === 'deposit';
                    return (
                      <tr key={item.id} className={isDeposit ? 'bg-green-600/10' : 'bg-red-600/10'}>
                        <td className="px-6 py-3 text-sm text-secondary-text">{formatDate(item.createdAt)}</td>
                        <td colSpan={6} className={`px-6 py-3 text-sm font-semibold flex items-center gap-2 ${isDeposit ? 'text-green-400' : 'text-red-400'}`}>
                          {isDeposit ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                          {isDeposit ? 'Depósito Realizado' : 'Saque Realizado'}
                        </td>
                        <td className={`px-6 py-3 text-sm font-semibold ${isDeposit ? 'text-green-400' : 'text-red-400'}`}>
                          {isDeposit ? '+' : '-'} R$ {item.amount.toFixed(2)}
                        </td>
                      </tr>
                    );
                  } else if (item.type === 'bet') {
                    const bet = item;
                    return (
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
                              <button onClick={() => handleUpdateStatus(bet, 'reembolso')} className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-full"><RefreshCw className="w-5 h-5" /></button>
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
                            <button onClick={() => handleOpenEditModal(bet)} className="text-secondary-text hover:text-primary-text"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteBet(bet)} className="text-secondary-text hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                  return null;
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
