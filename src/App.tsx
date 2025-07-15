import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AddBet } from './components/AddBet';
import { BetHistory } from './components/BetHistory';
import { Bankroll } from './components/Bankroll';
import { Login } from './components/Login';
import { PricingPage } from './components/PricingPage';
import { useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { WifiOff } from 'lucide-react';
import { AdminPanel } from './components/AdminPanel';
import { Paywall } from './components/Paywall'; // 1. Importar o Paywall

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  // 2. Obter os novos estados do hook
  const { user, loading, isAdmin, isSubscriber, error } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // 3. Lógica para determinar o acesso
  const hasFullAccess = isAdmin || isSubscriber;
  const protectedTabs = ['add-bet', 'history', 'bankroll'];
  const showPaywall = protectedTabs.includes(activeTab) && !hasFullAccess;

  const renderContent = () => {
    // 4. Se for para mostrar o paywall, renderiza-o
    if (showPaywall) {
      return <Paywall onNavigateToPricing={() => setActiveTab('pricing')} />;
    }

    // Caso contrário, mostra o conteúdo normal
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'add-bet':
        return <AddBet />;
      case 'history':
        return <BetHistory />;
      case 'bankroll':
        return <Bankroll />;
      case 'pricing':
        return <PricingPage />;
      case 'admin-panel':
        return <AdminPanel />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {error && (
        <div className="bg-yellow-100 border-b border-yellow-200 text-yellow-800 px-4 py-2 text-center text-sm">
          <div className="flex items-center justify-center">
            <WifiOff className="w-4 h-4 mr-2" />
            <p>{error}</p>
          </div>
        </div>
      )}
      
      <Layout activeTab={activeTab} onTabChange={setActiveTab} user={user}>
        {renderContent()}
      </Layout>
    </div>
  );
}

const AppWithTheme = () => (
  <ThemeProvider>
    <App />
  </ThemeProvider>
);

export default AppWithTheme;
