import React, { useState } from 'react';
import { Check, Star } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';


interface Plan {
  id: string;
  name: string;
  priceId: string; // ID do preço na Stripe ou outro gateway
  price: number;
  duration: string;
  features: string[];
  isPopular?: boolean;
  discountInfo?: string;
}

export const PricingPage: React.FC = () => {
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Lógica de Cálculo dos Preços com os novos descontos ---
  const monthlyPrice = 30;
  const quarterlyPricePerMonth = monthlyPrice * (1 - 0.25); // Desconto de 25%
  const annualPricePerMonth = (monthlyPrice * 12 * (1 - 0.40)) / 12; // Desconto de 40%

  const plans: Plan[] = [
    {
      id: 'monthly',
      name: 'Mensal',
      priceId: 'price_monthly_test',
      price: monthlyPrice,
      duration: '/mês',
      features: ['Apostas Ilimitadas', 'Dashboard Completo', 'Suporte por E-mail'],
    },
    {
      id: 'quarterly',
      name: 'Trimestral',
      priceId: 'price_quarterly_test',
      price: quarterlyPricePerMonth * 3,
      duration: '/trimestre',
      features: ['Tudo do plano Mensal', 'Análise de ROI Avançada', 'Histórico Extendido'],
      isPopular: true,
      discountInfo: `Poupe 25% (R$${quarterlyPricePerMonth.toFixed(2)}/mês)`,
    },
    {
      id: 'annual',
      name: 'Anual',
      priceId: 'price_annual_test',
      price: annualPricePerMonth * 12,
      duration: '/ano',
      features: ['Tudo do plano Trimestral', 'Relatórios Personalizados', 'Suporte Prioritário'],
      discountInfo: `Poupe 40% (R$${annualPricePerMonth.toFixed(2)}/mês)`,
    },
  ];

  
  const handleSubscription = async (plan: Plan) => {
    if (!user) {
      setError("Por favor, faça login para subscrever um plano.");
      return;
    }

    setLoadingPlan(plan.id);
    setError(null);

    try {
      

      console.log(`Iniciando checkout para o utilizador ${user.uid} com o plano ${plan.name} (Price ID: ${plan.priceId})`);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert(`Seria redirecionado para o pagamento do plano ${plan.name}.`);

    } catch (err) {
      setError("Não foi possível iniciar o processo de pagamento. Tente novamente.");
      console.error(err);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl">
            Escolha o Plano Ideal para Si
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
            Tenha acesso a ferramentas poderosas para levar a sua gestão de apostas ao próximo nível.
          </p>
        </div>

        {error && <p className="mt-8 text-center text-red-500">{error}</p>}

        <div className="mt-12 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative p-8 bg-white dark:bg-gray-800 border rounded-2xl shadow-sm flex flex-col ${
                plan.isPopular ? 'border-2 border-blue-600' : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 -translate-y-1/2 bg-blue-600 text-white px-3 py-1 text-sm font-semibold rounded-full shadow-md">
                  <Star className="w-4 h-4 inline-block mr-1" />
                  MAIS POPULAR
                </div>
              )}

              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
              {plan.discountInfo && (
                <p className="mt-2 text-sm text-green-600 dark:text-green-400 font-medium">{plan.discountInfo}</p>
              )}

              <div className="mt-4">
                <span className="text-5xl font-extrabold text-gray-900 dark:text-white">R${(plan.price / (plan.id === 'monthly' ? 1 : plan.id === 'quarterly' ? 3 : 12)).toFixed(2)}</span>
                <span className="text-base font-medium text-gray-500 dark:text-gray-400">/mês</span>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Cobrado como R${plan.price.toFixed(2)} {plan.duration}</p>

              <ul className="mt-8 space-y-4 text-left flex-grow">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check className="h-6 w-6 text-green-500" />
                    </div>
                    <p className="ml-3 text-base text-gray-700 dark:text-gray-300">{feature}</p>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscription(plan)}
                disabled={loadingPlan === plan.id}
                className={`mt-8 block w-full py-3 px-6 border border-transparent rounded-md text-center font-medium transition-colors disabled:opacity-50 ${
                  plan.isPopular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900'
                }`}
              >
                {loadingPlan === plan.id ? 'Aguarde...' : 'Escolher Plano'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
