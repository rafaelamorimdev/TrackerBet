import React, { useState } from 'react';
import { Search, TrendingUp, TrendingDown, Edit, Trash2, Check, X, AlertCircle, CheckCircle, RefreshCw, ChevronDown } from 'lucide-react';
import { useBets } from '../hooks/useBets';
import { Bet } from '../types';

export const BetHistory: React.FC = () => {
  const { bets, updateBetResult, updateBet, deleteBet } = useBets();

  // Estados para controlo do formulário, filtros e mensagens
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResult, setFilterResult] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [editingBet, setEditingBet] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ game: '', market: '', odd: '', stake: '' });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Lógica de filtragem e ordenação das apostas
  const filteredBets = bets
    .filter(bet => {
      if (timeFilter === 'all') return true;
      const betDate = new Date(bet.createdAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (timeFilter === 'today') return betDate >= today;

      const pastDate = new Date();
      pastDate.setHours(0, 0, 0, 0);

      if (timeFilter === '7days') { pastDate.setDate(pastDate.getDate() - 7); return betDate >= pastDate; }
      if (timeFilter === '30days') { pastDate.setMonth(pastDate.getMonth() - 1); return betDate >= pastDate; }
      return true;
    })
    .filter(bet => {
      const matchesSearch = bet.game.toLowerCase().includes(searchTerm.toLowerCase()) || bet.market.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterResult === 'all' || bet.result === filterResult;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'profit': return b.profit - a.profit;
        case 'stake': return b.stake - a.stake;
        default: return 0;
      }
    });

  const totalProfit = filteredBets.reduce((acc, bet) => acc + bet.profit, 0);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleUpdateResult = async (betId: string, result: 'green' | 'red' | 'reembolso') => {
    try {
      await updateBetResult(betId, result);
      showMessage('success', 'Resultado atualizado.');
    } catch {
      showMessage('error', 'Erro ao atualizar aposta.');
    }
  };

  const handleEditBet = (bet: Bet) => {
    setEditingBet(bet.id);
    setEditForm({ game: bet.game, market: bet.market, odd: bet.odd.toString(), stake: bet.stake.toString() });
  };

  const handleSaveEdit = async (betId: string) => {
    try {
      await updateBet(betId, { game: editForm.game, market: editForm.market, odd: parseFloat(editForm.odd), stake: parseFloat(editForm.stake) });
      setEditingBet(null);
      showMessage('success', 'Aposta atualizada.');
    } catch {
      showMessage('error', 'Erro ao atualizar aposta.');
    }
  };

  const handleCancelEdit = () => setEditingBet(null);

  const handleDeleteBet = async (betId: string) => {
    if (window.confirm('Tem a certeza? Esta ação não pode ser desfeita.')) {
      try {
        await deleteBet(betId);
        showMessage('success', 'Aposta excluída.');
      } catch {
        showMessage('error', 'Erro ao excluir aposta.');
      }
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'green': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'red': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'reembolso': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getResultLabel = (result: string) => {
    switch (result) {
      case 'green': return 'Green';
      case 'red': return 'Red';
      case 'reembolso': return 'Reembolso';
      case 'pending': return 'Pendente';
      default: return result;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Histórico de Apostas</h1>
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Lucro do Período:</span>
          <span className={`ml-2 font-bold ${totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            R$ {totalProfit.toFixed(2)}
          </span>
        </div>
      </div>

      {message && <div className={`flex items-center p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}{message.text}</div>}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white dark:placeholder-gray-400" 
            />
          </div>
          <div className="relative">
            <select value={filterResult} onChange={(e) => setFilterResult(e.target.value)} className="w-full appearance-none px-4 py-2 pr-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white">
              <option className="bg-white dark:bg-gray-700 text-black dark:text-white" value="all">Todos</option>
              <option className="bg-white dark:bg-gray-700 text-black dark:text-white" value="pending">Pendente</option>
              <option className="bg-white dark:bg-gray-700 text-black dark:text-white" value="green">Green</option>
              <option className="bg-white dark:bg-gray-700 text-black dark:text-white" value="red">Red</option>
              <option className="bg-white dark:bg-gray-700 text-black dark:text-white" value="reembolso">Reembolso</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
          <div className="relative">
            <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="w-full appearance-none px-4 py-2 pr-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white">
              <option className="bg-white dark:bg-gray-700 text-black dark:text-white" value="all">Todo o período</option>
              <option className="bg-white dark:bg-gray-700 text-black dark:text-white" value="today">Hoje</option>
              <option className="bg-white dark:bg-gray-700 text-black dark:text-white" value="7days">Últimos 7 dias</option>
              <option className="bg-white dark:bg-gray-700 text-black dark:text-white" value="30days">Último mês</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
          <div className="relative">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full appearance-none px-4 py-2 pr-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white">
              <option className="bg-white dark:bg-gray-700 text-black dark:text-white" value="date">Ordenar por data</option>
              <option className="bg-white dark:bg-gray-700 text-black dark:text-white" value="profit">Ordenar por lucro</option>
              <option className="bg-white dark:bg-gray-700 text-black dark:text-white" value="stake">Ordenar por Stake</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>{['Data', 'Jogo', 'Mercado', 'Odd', 'Stake', 'Status', 'Resultado', 'Ações'].map(header => (<th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{header}</th>))}</tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredBets.map((bet) => (
                <tr key={bet.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(bet.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{editingBet === bet.id ? <input value={editForm.game} onChange={e => setEditForm({...editForm, game: e.target.value})} className="p-1 border rounded bg-transparent dark:border-gray-600" /> : bet.game}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{editingBet === bet.id ? <input value={editForm.market} onChange={e => setEditForm({...editForm, market: e.target.value})} className="p-1 border rounded bg-transparent dark:border-gray-600" /> : bet.market}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{editingBet === bet.id ? <input type="number" value={editForm.odd} onChange={e => setEditForm({...editForm, odd: e.target.value})} className="w-20 p-1 border rounded bg-transparent dark:border-gray-600" /> : bet.odd.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{editingBet === bet.id ? <input type="number" value={editForm.stake} onChange={e => setEditForm({...editForm, stake: e.target.value})} className="w-24 p-1 border rounded bg-transparent dark:border-gray-600" /> : `R$ ${bet.stake.toFixed(2)}`}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {bet.result === 'pending' ? (<div className="flex space-x-2"><button onClick={() => handleUpdateResult(bet.id, 'green')} className="p-2 bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-300 rounded-full hover:bg-green-200 dark:hover:bg-green-500/40" title="Green"><Check className="w-4 h-4" /></button><button onClick={() => handleUpdateResult(bet.id, 'red')} className="p-2 bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 rounded-full hover:bg-red-200 dark:hover:bg-red-500/40" title="Red"><X className="w-4 h-4" /></button><button onClick={() => handleUpdateResult(bet.id, 'reembolso')} className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-500/40" title="Reembolso"><RefreshCw className="w-4 h-4" /></button></div>) : (<span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${getResultBadge(bet.result)}`}>{getResultLabel(bet.result)}</span>)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {bet.result === 'green' ? (<div className="flex items-center text-green-600 dark:text-green-400"><TrendingUp className="w-4 h-4 mr-1" />R$ {(bet.stake * bet.odd).toFixed(2)}</div>) : (<div className={`flex items-center ${bet.profit >= 0 ? 'text-gray-600 dark:text-gray-400' : 'text-red-600 dark:text-red-400'}`}>{bet.profit < 0 && <TrendingDown className="w-4 h-4 mr-1" />}R$ {bet.profit.toFixed(2)}</div>)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-3">{editingBet === bet.id ? (<><button onClick={() => handleSaveEdit(bet.id)} className="text-green-600 hover:text-green-800" title="Salvar"><Check className="w-5 h-5" /></button><button onClick={handleCancelEdit} className="text-gray-600 hover:text-gray-800" title="Cancelar"><X className="w-5 h-5" /></button></>) : (<button onClick={() => handleEditBet(bet)} className="text-blue-600 hover:text-blue-800" title="Editar"><Edit className="w-5 h-5" /></button>)}<button onClick={() => handleDeleteBet(bet.id)} className="text-red-600 hover:text-red-800" title="Excluir"><Trash2 className="w-5 h-5" /></button></div>
                  </td>
                </tr>))}
            </tbody>
          </table>
          {filteredBets.length === 0 && (<div className="text-center py-12 text-gray-500 dark:text-gray-400"><p>Nenhuma aposta encontrada para os filtros selecionados.</p></div>)}
        </div>
      </div>
    </div>
  );
};
