// Caminho: src/components/Paywall.tsx

import React from 'react';
import { Lock, Star } from 'lucide-react';

interface PaywallProps {
  onNavigateToPricing: () => void;
}

export const Paywall: React.FC<PaywallProps> = ({ onNavigateToPricing }) => {
  return (
    // --- ALTERAÇÕES DE ESTILO APLICADAS AQUI ---
    <div className="flex flex-col items-center justify-center h-full text-center bg-white dark:bg-card p-8 rounded-xl border border-gray-200 dark:border-card-border">
      <div className="p-4 bg-yellow-100 dark:bg-yellow-900/50 rounded-full mb-6">
        <Lock className="w-10 h-10 text-yellow-500 dark:text-yellow-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-primary-text mb-2">
        Funcionalidade Exclusiva para Assinantes
      </h2>
      <p className="max-w-md text-gray-600 dark:text-secondary-text mb-8">
        Para registar as suas apostas, gerir a sua banca e aceder a todas as funcionalidades, precisa de um plano ativo.
      </p>
      <button
        onClick={onNavigateToPricing}
        className="flex items-center justify-center px-8 py-3 bg-accent-start text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300"
      >
        <Star className="w-5 h-5 mr-2" />
        Ver Planos de Assinatura
      </button>
    </div>
  );
};
