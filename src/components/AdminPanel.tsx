// Caminho: src/components/AdminPanel.tsx

import React, { useState, useEffect } from 'react';
import { Shield, Users, DollarSign, UserPlus, Calendar, MailCheck, MailX, Clock } from 'lucide-react';
import { collection, getDocs, query, where, Timestamp, onSnapshot, orderBy, writeBatch, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { User, Subscription } from '../types';

interface MonthlyRevenue {
  name: string;
  Receita: number;
}

// Tipo para a lista de pré-autorizados
interface PreAuthorizedUser {
    email: string;
    accessUntil: Timestamp;
}

export const AdminPanel: React.FC = () => {
  // --- Estados para o Dashboard de Métricas ---
  const [activeUsers, setActiveUsers] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [currentMonthRevenue, setCurrentMonthRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Estados para a Gestão de Utilizadores ---
  const [emailList, setEmailList] = useState('');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<{ success: string[], failed: string[] } | null>(null);
  const [trialUsers, setTrialUsers] = useState<User[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [durationInDays, setDurationInDays] = useState(30);
  const [preAuthorizedList, setPreAuthorizedList] = useState<PreAuthorizedUser[]>([]);
  const [preAuthLoading, setPreAuthLoading] = useState(true);

  const { user, isAdmin } = useAuth();

  // Efeito para buscar os dados do Dashboard
  useEffect(() => {
    const fetchAdminData = async () => {
      if (!isAdmin) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfMonthTimestamp = Timestamp.fromDate(startOfMonth);

        const usersQuery = query(collection(db, 'users'), where("createdAt", ">=", startOfMonthTimestamp));
        const usersSnapshot = await getDocs(usersQuery);
        setActiveUsers(usersSnapshot.size);

        const subscriptionsSnapshot = await getDocs(collection(db, 'subscriptions'));
        const revenueByMonth: { [key: string]: number } = {};
        if (!subscriptionsSnapshot.empty) {
            subscriptionsSnapshot.docs.forEach(doc => {
                const sub = doc.data() as Subscription;
                if (sub.createdAt && sub.amount) {
                    const date = sub.createdAt.toDate();
                    const monthYear = `${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`;
                    revenueByMonth[monthYear] = (revenueByMonth[monthYear] || 0) + sub.amount;
                }
            });
        }

        const formattedRevenue = Object.keys(revenueByMonth).map(key => {
            const [month, year] = key.split('/');
            const monthName = new Date(2000, parseInt(month) - 1, 1).toLocaleString('pt-BR', { month: 'short' });
            return { name: `${monthName}/${year}`, Receita: revenueByMonth[key] };
        });
        setMonthlyRevenue(formattedRevenue);
        
        const currentMonthKey = `${today.getMonth() + 1}/${today.getFullYear().toString().slice(-2)}`;
        setCurrentMonthRevenue(revenueByMonth[currentMonthKey] || 0);
      } catch (err) {
        console.error("Erro ao buscar dados de admin:", err);
        if (typeof err === 'object' && err !== null && 'code' in err) {
          const firebaseError = err as { code: string };
          if (firebaseError.code === 'permission-denied') {
            setError("Permissão negada. Verifique as regras de segurança do Firestore.");
          } else {
            setError("Ocorreu um erro ao carregar os dados de administração.");
          }
        } else {
            setError("Ocorreu um erro desconhecido ao carregar os dados.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [isAdmin]);

  // Efeito para buscar a lista de utilizadores com acesso de teste ATIVO
  useEffect(() => {
    setListLoading(true);
    const usersWithTrialQuery = query(
      collection(db, 'users'), 
      where("accessUntil", ">", Timestamp.now()),
      orderBy("accessUntil", "asc")
    );

    const unsubscribe = onSnapshot(usersWithTrialQuery, (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
      setTrialUsers(usersList);
      setListLoading(false);
    }, () => setListLoading(false));

    return () => unsubscribe();
  }, []);
  
  // Efeito para buscar a lista de e-mails pré-autorizados
  useEffect(() => {
    if (!isAdmin) return;

    setPreAuthLoading(true);
    const preAuthQuery = query(collection(db, 'preAuthorizedUsers'), orderBy("accessUntil", "asc"));

    const unsubscribe = onSnapshot(preAuthQuery, (snapshot) => {
        const preAuthData = snapshot.docs.map(doc => doc.data() as PreAuthorizedUser);
        setPreAuthorizedList(preAuthData);
        setPreAuthLoading(false);
    }, (err) => {
        console.error("Erro ao buscar lista de pré-autorizados:", err);
        setError("Não foi possível carregar a lista de e-mails pré-autorizados.");
        setPreAuthLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // --- FUNÇÃO DE CONCEDER ACESSO ATUALIZADA (LÓGICA HÍBRIDA) ---
  const handleGrantAccessInBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailList.trim() || !isAdmin) return;

    setProcessing(true);
    setResults(null);

    const emails = emailList.split('\n').map(email => email.trim().toLowerCase()).filter(Boolean);
    const success: string[] = [];
    const failed: string[] = [];

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + durationInDays);
    const accessUntilTimestamp = Timestamp.fromDate(expirationDate);

    const batch = writeBatch(db);
    const usersRef = collection(db, 'users');
    
    for (const email of emails) {
      try {
        // 1. Procura se o utilizador já existe
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // 2a. Se existe, atualiza o documento do utilizador diretamente
          const userDoc = querySnapshot.docs[0];
          batch.update(doc(db, 'users', userDoc.id), { accessUntil: accessUntilTimestamp });
          success.push(`${email} (Acesso Imediato)`);
        } else {
          // 2b. Se não existe, adiciona à lista de pré-autorizados
          const preAuthRef = doc(db, 'preAuthorizedUsers', email);
          batch.set(preAuthRef, { 
            email: email,
            accessUntil: accessUntilTimestamp,
            grantedBy: user?.email
          });
          success.push(`${email} (Pré-Autorizado)`);
        }
      } catch (error) {
        console.error(`Erro ao processar ${email}:`, error);
        failed.push(email);
      }
    }

    try {
      await batch.commit();
      setResults({ success, failed });
    } catch (error) {
      console.error("Erro ao executar o batch commit:", error);
      setResults({ success: [], failed: emails });
    }
    
    setProcessing(false);
    setEmailList('');
  };

  const formatDate = (timestamp: Timestamp | undefined | null) => {
    if (timestamp?.toDate) return timestamp.toDate().toLocaleDateString('pt-BR');
    return 'N/A';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div></div>;
  }

  return (
    <div className="space-y-12">
      <div className="flex items-center space-x-3">
        <Shield className="w-8 h-8 text-cyan-500" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Painel de Administração</h1>
      </div>

      {error && <div className="text-red-500 bg-red-100 dark:bg-red-900/30 p-4 rounded-lg">{error}</div>}
      
      <div className="space-y-8">
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
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Receita Mensal dos Planos</h2>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700" style={{ height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }} />
                <Legend />
                <Bar dataKey="Receita" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Gerir Acesso de Utilizadores</h2>
          <div className="bg-card border border-card-border rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-accent-start/20 flex-shrink-0">
                <UserPlus className="w-6 h-6 text-accent-start" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary-text">Conceder Acesso Premium</h3>
                <p className="text-sm text-secondary-text mt-1">Concede acesso imediato a utilizadores existentes ou pré-autoriza novos e-mails.</p>
              </div>
            </div>
            <form onSubmit={handleGrantAccessInBulk} className="mt-6 space-y-4">
              <div>
                <label htmlFor="duration" className="text-sm font-medium text-secondary-text mb-2 block">Duração do Acesso</label>
                <select id="duration" value={durationInDays} onChange={(e) => setDurationInDays(Number(e.target.value))} className="w-full sm:w-auto bg-background border border-card-border rounded-lg py-2 px-4 text-primary-text focus:outline-none focus:ring-2 focus:ring-accent-start">
                  <option value={30}>30 Dias</option>
                  <option value={90}>90 Dias</option>
                  <option value={365}>365 Dias (1 Ano)</option>
                </select>
              </div>
              <div>
                <label htmlFor="email-list" className="text-sm font-medium text-secondary-text mb-2 block">Lista de E-mails</label>
                <textarea id="email-list" value={emailList} onChange={(e) => setEmailList(e.target.value)} placeholder="email1@exemplo.com&#10;email2@exemplo.com" className="w-full h-40 bg-background border border-card-border rounded-lg py-2 px-4 text-primary-text focus:outline-none focus:ring-2 focus:ring-accent-start" required />
              </div>
              <button type="submit" disabled={processing || !isAdmin} className="w-full sm:w-auto font-semibold px-6 py-2 rounded-lg text-white bg-gradient-to-r from-accent-start to-accent-end hover:opacity-90 transition-opacity disabled:opacity-50">
                {processing ? 'A processar...' : 'Conceder Acesso'}
              </button>
            </form>
            {results && (
              <div className="mt-6 border-t border-card-border pt-4">
                <h4 className="font-semibold mb-2">Resultados:</h4>
                <div className="flex items-center gap-2 text-green-400"><MailCheck size={16} /><span>{results.success.length} com sucesso:</span></div>
                <ul className="list-disc list-inside text-sm text-secondary-text pl-4 mt-1">
                    {results.success.map(email => <li key={email}>{email}</li>)}
                </ul>
                {results.failed.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-red-400"><MailX size={16} /><span>Falha em {results.failed.length}:</span></div>
                    <ul className="list-disc list-inside text-sm text-secondary-text pl-4 mt-1">{results.failed.map(email => <li key={email}>{email}</li>)}</ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Acessos de Teste Ativos</h2>
          <div className="bg-card border border-card-border rounded-xl overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Utilizador</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Expira em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {listLoading ? (
                  <tr><td colSpan={2} className="text-center py-10 text-secondary-text">A carregar...</td></tr>
                ) : trialUsers.length === 0 ? (
                  <tr><td colSpan={2} className="text-center py-10 text-secondary-text">Nenhum utilizador com acesso de teste ativo.</td></tr>
                ) : (
                  trialUsers.map(user => (
                    <tr key={user.uid}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-text">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-text">
                        <div className="flex items-center"><Calendar className="w-4 h-4 mr-2" />{formatDate(user.accessUntil)}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            <Clock className="inline-block w-5 h-5 mr-2 -mt-1" />
            Aguardando Registo (Pré-Autorizados)
          </h2>
          <div className="bg-card border border-card-border rounded-xl overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">E-mail</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Acesso Concedido Até</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {preAuthLoading ? (
                  <tr><td colSpan={2} className="text-center py-10 text-secondary-text">A carregar...</td></tr>
                ) : preAuthorizedList.length === 0 ? (
                  <tr><td colSpan={2} className="text-center py-10 text-secondary-text">Nenhum e-mail pré-autorizado.</td></tr>
                ) : (
                  preAuthorizedList.map(preAuthUser => (
                    <tr key={preAuthUser.email}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-text">{preAuthUser.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-text">
                        <div className="flex items-center"><Calendar className="w-4 h-4 mr-2" />{formatDate(preAuthUser.accessUntil)}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
