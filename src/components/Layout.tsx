import React, { useState } from 'react';
import { Home, PlusSquare, History, Wallet, LogOut, User as UserIcon, Menu, X, Sun, Moon, Star } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { User } from '../types';

interface LayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
  user: User;
}

export const Layout: React.FC<LayoutProps> = ({ activeTab, onTabChange, children, user }) => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'add-bet', label: 'Nova Aposta', icon: PlusSquare },
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'bankroll', label: 'Gerir Banca', icon: Wallet },
    { id: 'pricing', label: 'Planos', icon: Star }, // Novo item de navegação
  ];

  return (
    <div className="flex h-screen">
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-20 border-b dark:border-gray-700">
            <h1 className="text-2xl font-bold text-blue-600">BetTracker</h1>
          </div>
          <nav className="flex-grow p-4 space-y-2">
            {navItems.map(item => (
                <button
                key={item.id}
                onClick={() => { onTabChange(item.id); setIsMenuOpen(false); }}
                className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
                </button>
            ))}
          </nav>
          <div className="p-4 border-t dark:border-gray-700 space-y-2">
            <button onClick={toggleTheme} className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              {theme === 'light' ? <Moon className="w-5 h-5 mr-3" /> : <Sun className="w-5 h-5 mr-3" />}
              {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
            </button>
            <button onClick={logout} className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-800/50 transition-colors">
              <LogOut className="w-5 h-5 mr-3" />
              Terminar Sessão
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between md:justify-end h-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-600 dark:text-gray-300 md:hidden">
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-3 hidden md:block">{user?.email}</span>
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              {user?.photoURL ? (<img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full" />) : (<UserIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />)}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100 dark:bg-gray-900">
          {children}
        </main>
      </div>
       {isMenuOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsMenuOpen(false)}></div>}
    </div>
  );
};
