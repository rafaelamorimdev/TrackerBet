// Caminho: src/components/Dashboard.tsx

import React, { useMemo } from 'react';
import { useBets } from '../hooks/useBets';
import { useAuth } from '../hooks/useAuth';
import { Bet } from '../types'; // Importa o tipo Bet

// Um componente de exemplo para um card de estatísticas
const StatCard: React.FC<{ title: string; value: string; colorClass: string }> = ({ title, value, colorClass }) => (
  <div className="bg-card border border-card-border rounded-xl p-6">
    <p className="text-sm text-secondary-text mb-2">{title}</p>
    <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
  </div>
);

export const Dashboard: React.FC = () => {
  // --- CORREÇÃO 1: Usar 'historyItems' em vez de 'bets' ---
  const { historyItems, loading } = useBets();
  const { user } = useAuth();

  // --- CORREÇÃO 2: Usar 'useMemo' para calcular as estatísticas de forma segura ---
  const stats = useMemo(() => {
    if (!historyItems) {
      // Retorna valores padrão enquanto os dados carregam para evitar erros
      return {
        totalProfit: 0,
        totalStaked: 0,
        winRate: 0,
        betCount: 0,
      };
    }

    // Filtra para obter apenas os itens que são apostas
    const betsOnly = historyItems.filter((item): item is Bet => item.type === 'bet');
    
    // Filtra para obter apenas as apostas que já foram resolvidas (não estão pendentes)
    const settledBets = betsOnly.filter(bet => bet.result !== 'pending');

    // Calcula o lucro total a partir de todas as apostas
    const totalProfit = betsOnly.reduce((acc, bet) => acc + bet.profit, 0);
    
    // Calcula o total apostado
    const totalStaked = betsOnly.reduce((acc, bet) => acc + bet.stake, 0);

    // Calcula a taxa de vitórias (win rate)
    const wins = settledBets.filter(bet => bet.result === 'green').length;
    const winRate = settledBets.length > 0 ? (wins / settledBets.length) * 100 : 0;

    return {
      totalProfit,
      totalStaked,
      winRate,
      betCount: betsOnly.length,
    };
  }, [historyItems]); // Recalcula apenas quando o histórico mudar

  if (loading) {
    return <div className="text-center p-10">A carregar dados do dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">
          Bem-vindo, {user?.displayName || user?.email}!
        </h1>
        <p className="text-secondary-text mt-2">Aqui está um resumo da sua atividade.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Banca Atual" 
          value={`R$ ${user?.currentBankroll.toFixed(2)}`}
          colorClass="text-primary-text"
        />
        <StatCard 
          title="Lucro Total" 
          value={`R$ ${stats.totalProfit.toFixed(2)}`}
          colorClass={stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}
        />
        <StatCard 
          title="Total de Apostas" 
          value={String(stats.betCount)}
          colorClass="text-primary-text"
        />
        <StatCard 
          title="Taxa de Acerto" 
          value={`${stats.winRate.toFixed(1)}%`}
          colorClass="text-cyan-400"
        />
      </div>

      {/* Pode adicionar gráficos ou outras visualizações aqui */}
    </div>
  );
};
