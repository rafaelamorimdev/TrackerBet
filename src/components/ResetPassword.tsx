// Caminho: src/components/ResetPassword.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Lock, Eye, EyeOff } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const { confirmPasswordReset } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionCode, setActionCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('oobCode');
    if (code) {
      setActionCode(code);
    } else {
      setError("Código de redefinição inválido ou em falta. Por favor, solicite um novo link.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionCode) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await confirmPasswordReset(actionCode, newPassword);
      setSuccess("Senha alterada com sucesso! Já pode fechar esta página e fazer login com a sua nova senha.");
    } catch {
      setError("Ocorreu um erro ao alterar a senha. O link pode ter expirado. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-text mb-2">Betly</h1>
          <p className="text-secondary-text">Redefina a sua senha</p>
        </div>

        <div className="bg-card border border-card-border rounded-2xl p-8 shadow-lg">
          {success ? (
            <p className="text-center text-green-400">{success}</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-text" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nova Senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full bg-background border border-card-border rounded-lg py-3 pl-12 pr-12 text-primary-text focus:outline-none focus:ring-2 focus:ring-accent-start"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-text">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {error && <p className="text-sm text-red-400 text-center">{error}</p>}

              <button
                type="submit"
                disabled={!actionCode || loading}
                className="w-full font-bold text-lg px-8 py-3 rounded-xl text-white bg-gradient-to-r from-accent-start to-accent-end hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'A guardar...' : 'Guardar Nova Senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
