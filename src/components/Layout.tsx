import React, { useState } from 'react';
import { Home, PlusSquare, History, Wallet, LogOut, User as UserIcon, Menu, X, Sun, Moon, Star, Shield } from 'lucide-react';
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
  const { logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'add-bet', label: 'Nova Aposta', icon: PlusSquare },
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'bankroll', label: 'Gerir Banca', icon: Wallet },
  ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-background">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-card border-r border-gray-200 dark:border-card-border transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* --- LOGO ATUALIZADA AQUI --- */}
          <div className="flex items-center justify-center h-20 border-b border-gray-200 dark:border-card-border">
            <button onClick={() => onTabChange('dashboard')} className="focus:outline-none">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-300">
                Betly
              </h1>
            </button>
          </div>
          <nav className="flex-grow p-4 space-y-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => { onTabChange(item.id); setIsMenuOpen(false); }}
                className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-secondary-text dark:hover:bg-white/5 dark:hover:text-foreground'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            ))}
            {!isAdmin && (
              <button onClick={() => { onTabChange('pricing'); setIsMenuOpen(false); }} className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'pricing' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-secondary-text dark:hover:bg-white/5 dark:hover:text-foreground'}`}>
                <Star className="w-5 h-5 mr-3" /> Planos
              </button>
            )}
            {isAdmin && (
              <button onClick={() => { onTabChange('admin-panel'); setIsMenuOpen(false); }} className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'admin-panel' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-secondary-text dark:hover:bg-white/5 dark:hover:text-foreground'}`}>
                <Shield className="w-5 h-5 mr-3" /> Painel Admin
              </button>
            )}
          </nav>
          <div className="p-4 border-t border-gray-200 dark:border-card-border space-y-2">
            <button onClick={toggleTheme} className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-600 dark:text-secondary-text bg-gray-100 dark:bg-white/5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
              {theme === 'light' ? <Moon className="w-5 h-5 mr-3" /> : <Sun className="w-5 h-5 mr-3" />}
              {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
            </button>
            <button onClick={logout} className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-lg hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors">
              <LogOut className="w-5 h-5 mr-3" /> Terminar Sessão
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between md:justify-end h-20 bg-white dark:bg-card border-b border-gray-200 dark:border-card-border px-6">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-500 dark:text-secondary-text md:hidden">
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-secondary-text mr-3 hidden md:block">{user?.email}</span>
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-accent-start/20 flex items-center justify-center">
              {user?.photoURL ? (<img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full" />) : (<UserIcon className="w-6 h-6 text-blue-600 dark:text-accent-start" />)}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      {isMenuOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsMenuOpen(false)}></div>}
    </div>
  );
};
