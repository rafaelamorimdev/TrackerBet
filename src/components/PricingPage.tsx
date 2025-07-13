import React, { useState } from 'react';
import { Star, AlertCircle } from 'lucide-react';

// CORREÇÃO: O import do useAuth foi removido pois causava um erro de compilação.
// Em vez disso, criámos uma simulação do hook abaixo.

// Simulação (Mock) do hook useAuth para resolver o erro de compilação.
// No seu projeto real, esta função viria do ficheiro '../hooks/useAuth'.
const useAuth = () => {
  // Retorna um objeto de utilizador simulado, como o que o seu hook real faria.
  return {
    user: {
      uid: 'vwxXbXtyqqQf63mAgUNLCl2R29T2',
      email: 'rafael.ceb2010@gmail.com',
      displayName: 'Rafael Oliveira'
    }
  };
};


// --- Ícones (Pode continuar a usar a sua biblioteca `lucide-react`) ---
const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);
const IconPhone = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
);
const IconX = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

// --- Tipos (Mantendo os seus tipos existentes e adicionando os do novo modal) ---
interface Plan {
  id: string;
  name: string;
  priceId: string;
  price: number;
  duration: string;
  isPopular?: boolean;
  discountInfo?: string;
}

// O tipo 'User' do seu useAuth já deve ser compatível.
// Se não for, pode usar este como referência.
interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
}

interface CheckoutModalProps {
  plan: Plan;
  user: User;
  onClose: () => void;
  onConfirm: (data: { taxId: string; cellphone: string }) => void;
  loading: boolean;
}

// --- Novo Componente do Modal de Checkout ---
const CheckoutModal: React.FC<CheckoutModalProps> = ({ plan, user, onClose, onConfirm, loading }) => {
  const [taxId, setTaxId] = useState('');
  const [cellphone, setCellphone] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (taxId.replace(/\D/g, '').length !== 11) {
      setError('Por favor, insira um CPF válido com 11 dígitos.');
      return;
    }
    if (cellphone.replace(/\D/g, '').length < 10) {
      setError('Por favor, insira um número de telemóvel válido com DDD.');
      return;
    }
    setError('');
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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md transform transition-all scale-95 hover:scale-100 duration-300">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Confirmar Compra</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <IconX />
            </button>
          </div>
          <div className="space-y-2 text-gray-700 dark:text-gray-300">
            <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg"><span className="font-medium">Plano:</span><span className="font-bold text-blue-600 dark:text-blue-400">{plan.name}</span></div>
            <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg"><span className="font-medium">Valor:</span><span className="font-bold">R$ {plan.price.toFixed(2).replace('.', ',')}</span></div>
            <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg"><span className="font-medium">Email:</span><span className="font-semibold">{user.email}</span></div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-6 mb-4">Para finalizar, por favor, confirme os seus dados abaixo.</p>
          <div className="space-y-4">
            {error && <p className="text-sm text-red-500 bg-red-100 dark:bg-red-900/30 p-3 rounded-lg text-center">{error}</p>}
            <div>
              <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CPF</label>
              <div className="relative"><IconUser /><input type="text" id="taxId" value={taxId} onChange={handleTaxIdChange} placeholder="000.000.000-00" className="w-full pl-10 pr-4 py-3 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"/></div>
            </div>
            <div>
              <label htmlFor="cellphone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telemóvel (com DDD)</label>
              <div className="relative"><IconPhone /><input type="text" id="cellphone" value={cellphone} onChange={handleCellphoneChange} placeholder="(00) 90000-0000" className="w-full pl-10 pr-4 py-3 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"/></div>
            </div>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row-reverse gap-3">
            <button onClick={handleConfirm} disabled={loading || !taxId || !cellphone} className="w-full sm:w-auto inline-flex justify-center rounded-lg border border-transparent bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">{loading ? 'A processar...' : 'Confirmar e Pagar'}</button>
            <button type="button" onClick={onClose} className="w-full sm:w-auto inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-6 py-3 text-base font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- Componente Principal da Página de Planos ---
export const PricingPage: React.FC = () => {
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const monthlyPrice = 30;
  const quarterlyPricePerMonth = monthlyPrice * (1 - 0.25);
  const annualPricePerMonth = (monthlyPrice * 12 * (1 - 0.40)) / 12;

  const plans: Plan[] = [
    { id: 'monthly', name: 'Mensal', priceId: 'price_monthly_test', price: monthlyPrice, duration: '/mês' },
    { id: 'quarterly', name: 'Trimestral', priceId: 'price_quarterly_test', price: quarterlyPricePerMonth * 3, duration: '/trimestre', isPopular: true, discountInfo: `Poupe 25%` },
    { id: 'annual', name: 'Anual', priceId: 'price_annual_test', price: annualPricePerMonth * 12, duration: '/ano', discountInfo: `Poupe 40%` },
  ];

  // Função de checkout atualizada para receber CPF e Telemóvel
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
            taxId: data.taxId,       // Enviando o CPF
            cellphone: data.cellphone // Enviando o Telemóvel
          },
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Falha ao comunicar com o servidor.');
      
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        throw new Error('URL de checkout não recebido.');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível iniciar o processo de pagamento.");
      setLoadingPlan(null);
      // Fecha o modal em caso de erro para o utilizador ver a mensagem na página principal.
      setSelectedPlan(null);
    }
  };

  return (
    <>
      {selectedPlan && user && (
        <CheckoutModal
          plan={selectedPlan}
          user={user}
          onConfirm={handleSubscription}
          onClose={() => setSelectedPlan(null)}
          loading={loadingPlan === selectedPlan.id}
        />
      )}

      <div className="bg-gray-100 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl">Escolha o Plano Ideal para Si</h1>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">Acesso completo à plataforma. Escolha o período e aproveite os descontos.</p>
          </div>

          {error && <div className="mt-8 mx-auto max-w-md p-3 rounded-lg bg-red-100 text-red-800 flex items-center justify-center text-sm font-medium"><AlertCircle className="w-5 h-5 mr-2" />{error}</div>}

          <div className="mt-12 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8">
            {plans.map((plan) => (
              <div key={plan.id} className={`relative p-8 bg-white dark:bg-gray-800 border rounded-2xl shadow-sm flex flex-col justify-between ${plan.isPopular ? 'border-2 border-blue-600' : 'border-gray-200 dark:border-gray-700'}`}>
                {plan.isPopular && <div className="absolute top-0 -translate-y-1/2 bg-blue-600 text-white px-3 py-1 text-sm font-semibold rounded-full shadow-md"><Star className="w-4 h-4 inline-block mr-1" />MAIS POPULAR</div>}
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                  {plan.discountInfo && <p className="mt-2 text-sm text-green-600 dark:text-green-400 font-medium">{plan.discountInfo}</p>}
                  <div className="mt-4">
                    <span className="text-5xl font-extrabold text-gray-900 dark:text-white">R${(plan.price / (plan.id === 'monthly' ? 1 : plan.id === 'quarterly' ? 3 : 12)).toFixed(2).replace('.',',')}</span>
                    <span className="text-base font-medium text-gray-500 dark:text-gray-400">/mês</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Cobrado como R${plan.price.toFixed(2).replace('.',',')} {plan.duration}</p>
                </div>
                <button onClick={() => setSelectedPlan(plan)} disabled={!!loadingPlan} className={`mt-8 block w-full py-3 px-6 border border-transparent rounded-md text-center font-medium transition-colors disabled:opacity-50 ${plan.isPopular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900'}`}>
                  Escolher Plano
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
