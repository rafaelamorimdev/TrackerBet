import React, { useState } from 'react';
import { Star, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// Interface para definir a estrutura de um plano
interface Plan {
  id: string;
  name: string;
  priceId: string;
  price: number;
  duration: string;
  isPopular?: boolean;
  discountInfo?: string;
}

// Sub-componente para o Modal de Confirmação de CPF
const ConfirmationModal: React.FC<{
  plan: Plan;
  userEmail: string;
  onConfirm: (taxId: string) => void;
  onClose: () => void;
  loading: boolean;
}> = ({ plan, userEmail, onConfirm, onClose, loading }) => {
  const [taxId, setTaxId] = useState('');

  const handleConfirmClick = () => {
    // Adicionar validação básica de CPF se necessário
    if (taxId.trim().length === 11) {
      onConfirm(taxId);
    } else {
      alert("Por favor, insira um CPF válido com 11 dígitos.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Confirmar Compra</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Para finalizar, por favor, confirme os seus dados e insira o seu CPF.</p>
        
        <div className="mt-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-sm">
          <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Plano:</span><span className="font-medium text-gray-900 dark:text-white">{plan.name}</span></div>
          <div className="flex justify-between mt-2"><span className="text-gray-600 dark:text-gray-400">Valor:</span><span className="font-medium text-gray-900 dark:text-white">R$ {plan.price.toFixed(2)}</span></div>
          <div className="flex justify-between mt-2"><span className="text-gray-600 dark:text-gray-400">Email:</span><span className="font-medium text-gray-900 dark:text-white">{userEmail}</span></div>
        </div>

        <div className="mt-6">
          <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CPF (apenas números)</label>
          <input
            type="text"
            id="taxId"
            value={taxId}
            maxLength={11}
            onChange={(e) => setTaxId(e.target.value.replace(/\D/g, ''))}
            placeholder="00000000000"
            className="w-full px-4 py-3 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          />
        </div>

        <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-4">
          <button onClick={onClose} disabled={loading} className="mt-4 sm:mt-0 w-full sm:w-auto px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Cancelar
          </button>
          <button onClick={handleConfirmClick} disabled={loading || !taxId} className="w-full sm:w-auto px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center">
            {loading ? 'Aguarde...' : 'Confirmar e Pagar'}
          </button>
        </div>
      </div>
    </div>
  );
};


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

  const handleSubscription = async (taxId: string) => {
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
          user: { uid: user.uid, email: user.email, displayName: user.displayName, taxId: taxId },
          plan: selectedPlan,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao comunicar com o servidor.');
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('URL de checkout não recebido.');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível iniciar o processo de pagamento.");
      setLoadingPlan(null);
    }
  };

  return (
    <>
      {selectedPlan && user && (
        <ConfirmationModal
          plan={selectedPlan}
          userEmail={user.email}
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
                    <span className="text-5xl font-extrabold text-gray-900 dark:text-white">R${(plan.price / (plan.id === 'monthly' ? 1 : plan.id === 'quarterly' ? 3 : 12)).toFixed(2)}</span>
                    <span className="text-base font-medium text-gray-500 dark:text-gray-400">/mês</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Cobrado como R${plan.price.toFixed(2)} {plan.duration}</p>
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
