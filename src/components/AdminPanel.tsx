// Caminho: src/components/AdminPanel.tsx

import React, { useState, useEffect } from 'react';
import { Shield, Users, DollarSign } from 'lucide-react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Assumimos que existirá uma coleção 'subscriptions' com esta estrutura
interface Subscription {
  amount: number;
  createdAt: Timestamp;
  userId: string;
}

// Interface para os dados do gráfico
interface MonthlyRevenue {
  name: string; // Ex: "Jul/25"
  Receita: number;
}

export const AdminPanel: React.FC = () => {
  const [activeUsers, setActiveUsers] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [currentMonthRevenue, setCurrentMonthRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      setError(null);
      try {
        // --- 1. Buscar Utilizadores Ativos (Novos no Mês) ---
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfMonthTimestamp = Timestamp.fromDate(startOfMonth);

        const usersQuery = query(collection(db, 'users'), where("createdAt", ">=", startOfMonthTimestamp));
        const usersSnapshot = await getDocs(usersQuery);
        setActiveUsers(usersSnapshot.size);

        // --- 2. Buscar e Processar Receita dos Planos ---
        const subscriptionsCollectionRef = collection(db, 'subscriptions');
        const subscriptionsSnapshot = await getDocs(subscriptionsCollectionRef);
        
        const revenueByMonth: { [key: string]: number } = {};

        if (!subscriptionsSnapshot.empty) {
            subscriptionsSnapshot.docs.forEach(doc => {
              const sub = doc.data() as Subscription;
              if (sub.createdAt && sub.amount) {
                const date = sub.createdAt.toDate();
                const monthYear = `${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`; // Formato "7/25"
                revenueByMonth[monthYear] = (revenueByMonth[monthYear] || 0) + sub.amount;
              }
            });
        }

        const formattedRevenue = Object.keys(revenueByMonth).map(key => {
          const [month, year] = key.split('/');
          const monthName = new Date(2000, parseInt(month) - 1, 1).toLocaleString('default', { month: 'short' });
          return {
            name: `${monthName}/${year}`,
            Receita: revenueByMonth[key],
          };
        });
        setMonthlyRevenue(formattedRevenue);
        
        // Calcular a receita do mês atual
        const currentMonthKey = `${today.getMonth() + 1}/${today.getFullYear().toString().slice(-2)}`;
        setCurrentMonthRevenue(revenueByMonth[currentMonthKey] || 0);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("Erro ao buscar dados de admin:", err);
        // --- CORREÇÃO: Mostrar uma mensagem de erro mais específica ---
        if (err.code === 'permission-denied') {
          setError("Permissão negada. Verifique as regras de segurança do Firestore para as coleções 'users' e 'subscriptions'.");
        } else {
          setError("Ocorreu um erro ao carregar os dados de administração.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <Shield className="w-8 h-8 text-cyan-500" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Painel de Administração
        </h1>
      </div>

      {/* Mostra a mensagem de erro, se existir */}
      {error && <div className="text-red-500 bg-red-100 dark:bg-red-900/30 p-4 rounded-lg">{error}</div>}
      
      {/* Secção de Métricas Principais */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/50"><Users className="w-6 h-6 text-blue-600 dark:text-blue-400" /></div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Novos Utilizadores (Este Mês)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeUsers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/50"><DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" /></div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Receita (Este Mês)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">R$ {currentMonthRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secção de Gráfico de Receita Mensal */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Receita Mensal dos Planos</h2>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700" style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyRevenue}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }}
              />
              <Legend />
              <Bar dataKey="Receita" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
