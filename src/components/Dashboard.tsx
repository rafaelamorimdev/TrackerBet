import React from 'react';
import { TrendingUp, CheckCircle, XCircle, Clock, DollarSign, Target } from 'lucide-react';
import { useBets } from '../hooks/useBets';
import { useAuth } from '../hooks/useAuth';

export const Dashboard: React.FC = () => {
  const { user, isAdmin, loading: authLoading } = useAuth(); 
  const { bets, loading: betsLoading } = useBets();

  if (authLoading || betsLoading) {
    return <div className="text-center text-gray-500 dark:text-secondary-text">A carregar dados do dashboard...</div>;
  }
  
  const totalProfit = bets.reduce((acc, bet) => acc + bet.profit, 0);
  const totalStaked = bets.reduce((acc, bet) => acc + bet.stake, 0);
  const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;
  
  const greenBets = bets.filter(bet => bet.result === 'green').length;
  const redBets = bets.filter(bet => bet.result === 'red').length;
  const pendingBets = bets.filter(bet => bet.result === 'pending').length;
  const hitRate = bets.length > 0 ? (greenBets / (greenBets + redBets)) * 100 : 0;

  const stats = [
    { title: 'Banca Atual', value: `R$ ${user?.currentBankroll.toFixed(2)}`, icon: DollarSign, color: 'text-blue-500 dark:text-blue-400' },
    { title: 'Lucro Total', value: `R$ ${totalProfit.toFixed(2)}`, icon: TrendingUp, color: totalProfit >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400' },
    { title: 'ROI', value: `${roi.toFixed(1)}%`, icon: Target, color: roi >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400' },
    { title: 'Taxa de Acerto', value: `${hitRate.toFixed(1)}%`, icon: CheckCircle, color: 'text-yellow-500 dark:text-yellow-400' },
  ];
  
  return (
    <div className="space-y-6">
      {/* CORREÇÃO: Cor do título ajustada para ambos os modos */}
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
      
      {isAdmin && (
        <div className="p-4 mb-4 text-sm text-cyan-800 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-900/50 rounded-lg" role="alert">
          <span className="font-medium">Modo Administrador:</span> Você está logado como administrador.
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(stat => (
          // CORREÇÃO: Estilos de fundo, borda e texto dos cartões ajustados
          <div key={stat.title} className="bg-white dark:bg-card p-6 rounded-xl border border-gray-200 dark:border-card-border">
            <div className="flex items-center">
              <div className={`p-3 rounded-full bg-gray-100 dark:bg-white/5`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 dark:text-secondary-text">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-primary-text">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CORREÇÃO: Estilos de fundo, borda e texto dos cartões ajustados */}
        <div className="lg:col-span-1 bg-white dark:bg-card p-6 rounded-xl border border-gray-200 dark:border-card-border">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-primary-text mb-4">Resumo das Apostas</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-gray-700 dark:text-secondary-text"><div className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" />Green</div><p className="font-medium text-gray-900 dark:text-primary-text">{greenBets}</p></div>
            <div className="flex justify-between items-center text-gray-700 dark:text-secondary-text"><div className="flex items-center"><XCircle className="w-5 h-5 text-red-500 mr-2" />Red</div><p className="font-medium text-gray-900 dark:text-primary-text">{redBets}</p></div>
            <div className="flex justify-between items-center text-gray-700 dark:text-secondary-text"><div className="flex items-center"><Clock className="w-5 h-5 text-yellow-500 mr-2" />Pendentes</div><p className="font-medium text-gray-900 dark:text-primary-text">{pendingBets}</p></div>
          </div>
        </div>
        
        {/* CORREÇÃO: Estilos de fundo, borda e texto dos cartões ajustados */}
        <div className="lg:col-span-2 bg-white dark:bg-card p-6 rounded-xl border border-gray-200 dark:border-card-border">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-primary-text mb-4">Últimas Atividades</h2>
          <div className="space-y-3">
            {bets.slice(0, 5).map(bet => (
              <div key={bet.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5">
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{bet.game}</p>
                  <p className="text-sm text-gray-500 dark:text-secondary-text">{bet.market} @ {bet.odd.toFixed(2)}</p>
                </div>
                <div className={`text-right ${bet.result === 'green' ? 'text-green-500 dark:text-green-400' : bet.result === 'red' ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-secondary-text'}`}>
                  <p className="font-semibold">{bet.result === 'pending' ? `R$ ${bet.stake.toFixed(2)}` : `R$ ${bet.profit.toFixed(2)}`}</p>
                  <p className="text-xs capitalize">{bet.result}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
