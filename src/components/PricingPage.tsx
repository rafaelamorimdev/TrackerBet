// Caminho: src/components/PricingPage.tsx

import React, { useState } from 'react';
import { Star, AlertCircle, Award } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { User } from '../types';
import { Timestamp } from 'firebase/firestore';

// --- Interfaces ---
interface Plan {
  id: string;
  name: string;
  priceId: string;
  price: number;
  duration: string;
  isPopular?: boolean;
  discountInfo?: string;
}

interface CheckoutModalProps {
  plan: Plan;
  user: User;
  onClose: () => void;
  onConfirm: (data: { taxId: string; cellphone: string }) => void;
  loading: boolean;
  error: string | null;
}

// --- Componente do Modal de Checkout ---
const CheckoutModal: React.FC<CheckoutModalProps> = ({ plan, user, onClose, onConfirm, loading, error }) => {
  const [taxId, setTaxId] = useState('');
  const [cellphone, setCellphone] = useState('');
  const [modalError, setModalError] = useState('');

  const handleConfirm = () => {
    if (taxId.replace(/\D/g, '').length !== 11) {
      setModalError('Por favor, insira um CPF válido com 11 dígitos.');
      return;
    }
    if (cellphone.replace(/\D/g, '').length < 10) {
      setModalError('Por favor, insira um número de telemóvel válido com DDD.');
      return;
    }
    setModalError('');
    onConfirm({ taxId, cellphone });
  };

  const handleTaxIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formattedValue = value
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .substring(0, 14);
    setTaxId(formattedValue);
  };

  const handleCellphoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    let formattedValue = value.replace(/^(\d{2})(\d)/, '($1) $2');
    if (value.length > 10) {
        formattedValue = formattedValue.replace(/(\d{5})(\d)/, '$1-$2');
    } else {
        formattedValue = formattedValue.replace(/(\d{4})(\d)/, '$1-$2');
    }
    setCellphone(formattedValue.substring(0, 15));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-card-border rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-primary-text">Confirmar Compra</h2>
            <button onClick={onClose} className="text-secondary-text hover:text-primary-text">&times;</button>
          </div>
          <div className="space-y-2 text-secondary-text">
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg"><span className="font-medium">Plano:</span><span className="font-bold text-accent-start">{plan.name}</span></div>
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg"><span className="font-medium">Valor:</span><span className="font-bold">R$ {plan.price.toFixed(2).replace('.', ',')}</span></div>
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg"><span className="font-medium">Email:</span><span className="font-semibold">{user.email}</span></div>
          </div>
          <p className="text-sm text-secondary-text mt-6 mb-4">Para finalizar, por favor, confirme os seus dados abaixo.</p>
          <div className="space-y-4">
            {(modalError || error) && <p className="text-sm text-red-400 bg-red-900/30 p-3 rounded-lg text-center">{modalError || error}</p>}
            <div>
              <label htmlFor="taxId" className="block text-sm font-medium text-secondary-text mb-1">CPF</label>
              <input type="text" id="taxId" value={taxId} onChange={handleTaxIdChange} placeholder="000.000.000-00" className="w-full pl-4 pr-4 py-3 bg-background border border-card-border rounded-lg focus:ring-2 focus:ring-accent-start text-primary-text"/>
            </div>
            <div>
              <label htmlFor="cellphone" className="block text-sm font-medium text-secondary-text mb-1">Telemóvel (com DDD)</label>
              <input type="text" id="cellphone" value={cellphone} onChange={handleCellphoneChange} placeholder="(00) 90000-0000" className="w-full pl-4 pr-4 py-3 bg-background border border-card-border rounded-lg focus:ring-2 focus:ring-accent-start text-primary-text"/>
            </div>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row-reverse gap-3">
            <button onClick={handleConfirm} disabled={loading || !taxId || !cellphone} className="w-full sm:w-auto inline-flex justify-center rounded-lg border border-transparent bg-accent-start px-6 py-3 text-base font-medium text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent-start focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? 'A processar...' : 'Confirmar e Pagar'}
            </button>
            <button type="button" onClick={onClose} className="w-full sm:w-auto inline-flex justify-center rounded-lg border border-card-border bg-white/5 px-6 py-3 text-base font-medium text-secondary-text shadow-sm hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-start">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const formatDate = (timestamp: Timestamp | undefined | null) => {
    if (timestamp?.toDate) {
      return timestamp.toDate().toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return 'Data indisponível';
};

// --- Componente Principal da Página de Planos ---
export const PricingPage: React.FC = () => {
  const { user, isSubscriber, loading: authLoading } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const plans: Plan[] = [
    { id: 'monthly', name: 'Mensal', priceId: 'price_mensal_id', price: 29.90, duration: '/mês' },
    { id: 'quarterly', name: 'Trimestral', priceId: 'price_trimestral_id', price: 66.00, duration: '/trimestre', isPopular: true, discountInfo: `Poupe 26%` },
    { id: 'annual', name: 'Anual', priceId: 'price_anual_id', price: 216.00, duration: '/ano', discountInfo: `Poupe 40%` },
  ];

  const handleSubscription = async (data: { taxId: string; cellphone: string }) => {
    if (!user || !selectedPlan) {
      setError("Ocorreu um erro. Por favor, tente novamente.");
      return;
    }

    setLoadingPlan(selectedPlan.id);
    setError(null);

    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          user: { 
            uid: user.uid, 
            email: user.email, 
            displayName: user.displayName, 
            taxId: data.taxId.replace(/\D/g, ''),
            cellphone: data.cellphone.replace(/\D/g, '')
          },
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Falha ao comunicar com o servidor.');
      }
      
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        throw new Error('URL de checkout não recebido.');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível iniciar o processo de pagamento.");
      setLoadingPlan(null);
      setSelectedPlan(null);
    }
  };

  if (authLoading) {
    return <div className="text-center p-10">A verificar o seu plano...</div>;
  }

  // --- LÓGICA CONDICIONAL ADICIONADA ---
  if (isSubscriber && user) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8">
        <Award className="w-16 h-16 text-yellow-400 mb-4" />
        <h1 className="text-3xl font-bold text-primary-text mb-2">Você já tem Acesso Premium!</h1>
        <p className="text-lg text-secondary-text max-w-lg">
          O seu acesso de teste foi concedido e todas as funcionalidades premium estão ativas.
        </p>
        <div className="mt-6 bg-card border border-card-border rounded-xl p-6">
            <p className="text-sm text-secondary-text">O seu acesso expira em:</p>
            <p className="text-2xl font-bold text-accent-start mt-1">
                {formatDate(user.accessUntil)}
            </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {selectedPlan && user && (
        <CheckoutModal
          plan={selectedPlan}
          user={user}
          onConfirm={handleSubscription}
          onClose={() => setSelectedPlan(null)}
          loading={loadingPlan === selectedPlan.id}
          error={error}
        />
      )}

      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">Escolha o Plano Ideal</h1>
          <p className="mt-2 text-gray-600 dark:text-secondary-text">
            Acesso completo à plataforma. Escolha o período e aproveite os descontos.
          </p>
        </div>

        {error && <div className="mt-8 mx-auto max-w-md p-3 rounded-lg bg-red-900/50 text-red-400 flex items-center justify-center text-sm font-medium"><AlertCircle className="w-5 h-5 mr-2" />{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto pt-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-card border rounded-2xl p-8 flex flex-col ${plan.isPopular ? 'border-accent-start shadow-2xl shadow-accent-start/10' : 'border-card-border'}`}
            >
              {plan.isPopular && (
                <div className="bg-accent-start text-white text-xs font-bold uppercase tracking-wider rounded-full px-3 py-1 self-center -mt-12 mb-4">
                  <Star className="w-4 h-4 inline-block -mt-1 mr-1" /> Mais Popular
                </div>
              )}
              <h2 className="text-2xl font-bold text-primary-text text-center">{plan.name}</h2>
              {plan.discountInfo && <p className="text-sm text-green-400 text-center mb-4">{plan.discountInfo}</p>}
              
              <div className="text-center my-6">
                <span className="text-5xl font-extrabold text-primary-text">R${(plan.price / (plan.id === 'monthly' ? 1 : plan.id === 'quarterly' ? 3 : 12)).toFixed(2).replace('.',',')}</span>
                <span className="text-lg text-secondary-text">/mês</span>
              </div>
              <p className="text-xs text-secondary-text text-center mb-8">Cobrado como R${plan.price.toFixed(2).replace('.',',')} {plan.duration}</p>

              <div className="flex-grow"></div>

              <button
                onClick={() => setSelectedPlan(plan)}
                disabled={!!loadingPlan}
                className={`w-full mt-8 font-bold text-lg px-8 py-3 rounded-xl text-white transition-opacity disabled:opacity-50 ${plan.isPopular ? 'bg-gradient-to-r from-accent-start to-accent-end hover:opacity-90' : 'bg-white/10 hover:bg-white/20'}`}
              >
                Escolher Plano
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
