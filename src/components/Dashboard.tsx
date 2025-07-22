// Caminho: src/components/Dashboard.tsx

import React, { useMemo } from 'react';
import { useBets } from '../hooks/useBets';
import { useAuth } from '../hooks/useAuth';
import { Bet } from '../types'; // Importa o tipo Bet

// --- CORREÇÃO DE ESTILO: Adicionadas classes para modo claro ---
const StatCard: React.FC<{ title: string; value: string; colorClass: string }> = ({ title, value, colorClass }) => (
  <div className="bg-white dark:bg-card border border-gray-200 dark:border-card-border rounded-xl p-6 shadow-sm">
    <p className="text-sm text-gray-500 dark:text-secondary-text mb-2">{title}</p>
    <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
  </div>
);

export const Dashboard: React.FC = () => {
  const { historyItems, loading } = useBets();
  const { user } = useAuth();

  const stats = useMemo(() => {
    if (!historyItems) {
      return {
        totalProfit: 0,
        totalStaked: 0,
        winRate: 0,
        betCount: 0,
      };
    }

    const betsOnly = historyItems.filter((item): item is Bet => item.type === 'bet');
    const settledBets = betsOnly.filter(bet => bet.result !== 'pending');
    const totalProfit = betsOnly.reduce((acc, bet) => acc + bet.profit, 0);
    const totalStaked = betsOnly.reduce((acc, bet) => acc + bet.stake, 0);
    const wins = settledBets.filter(bet => bet.result === 'green').length;
    const winRate = settledBets.length > 0 ? (wins / settledBets.length) * 100 : 0;

    return {
      totalProfit,
      totalStaked,
      winRate,
      betCount: betsOnly.length,
    };
  }, [historyItems]);

  if (loading) {
    return <div className="text-center p-10">A carregar dados do dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">
          Bem-vindo, {user?.displayName || user?.email}!
        </h1>
        <p className="text-gray-600 dark:text-secondary-text mt-2">Aqui está um resumo da sua atividade.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* --- CORREÇÃO DE ESTILO: Classes de cor atualizadas para ambos os modos --- */}
        <StatCard 
          title="Banca Atual" 
          value={`R$ ${user?.currentBankroll.toFixed(2)}`}
          colorClass="text-gray-900 dark:text-primary-text"
        />
        <StatCard 
          title="Lucro Total" 
          value={`R$ ${stats.totalProfit.toFixed(2)}`}
          colorClass={stats.totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
        />
        <StatCard 
          title="Total de Apostas" 
          value={String(stats.betCount)}
          colorClass="text-gray-900 dark:text-primary-text"
        />
        <StatCard 
          title="Taxa de Acerto" 
          value={`${stats.winRate.toFixed(1)}%`}
          colorClass="text-blue-600 dark:text-cyan-400"
        />
      </div>

      {/* Pode adicionar gráficos ou outras visualizações aqui */}
    </div>
  );
};
