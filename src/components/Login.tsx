import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

// Componente para o ícone do Google
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.521-3.108-11.187-7.481l-6.571,4.819C9.656,39.663,16.318,44,24,44z"></path>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C39.978,36.218,44,30.651,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
  </svg>
);

export const Login: React.FC = () => {
  const { login, register, loginWithGoogle, sendPasswordReset, error } = useAuth();
  const [view, setView] = useState<'login' | 'register' | 'forgotPassword'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    try {
      if (view === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
        setSuccessMessage('Conta criada! Um e-mail de verificação foi enviado para a sua caixa de entrada.');
        setView('login'); // Volta para a tela de login após o registo
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setFormError('E-mail ou senha inválidos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setFormError('Este e-mail já está em uso.');
      } else {
        setFormError('Ocorreu um erro. Tente novamente.');
      }
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    try {
      await sendPasswordReset(email);
      // --- MENSAGEM ATUALIZADA AQUI ---
      setSuccessMessage('Link enviado! Verifique a sua caixa de entrada e a pasta de Spam.');
    } catch {
      setFormError('Não foi possível enviar o e-mail. Verifique se o endereço está correto.');
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFormError(null);
    setSuccessMessage(null);
  };

  const changeView = (newView: 'login' | 'register' | 'forgotPassword') => {
    resetForm();
    setView(newView);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-text mb-2">Betly</h1>
          <p className="text-secondary-text">Controle as suas apostas com precisão</p>
        </div>

        <div className="bg-card border border-card-border rounded-2xl p-8 shadow-lg">
          {view === 'forgotPassword' ? (
            // --- Formulário de Recuperação de Senha ---
            <div>
              <button onClick={() => changeView('login')} className="flex items-center text-sm text-secondary-text mb-6 hover:text-primary-text">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para o Login
              </button>
              <h2 className="text-xl font-bold text-primary-text mb-2">Recuperar Senha</h2>
              <p className="text-secondary-text text-sm mb-6">Insira o seu e-mail para receber um link de recuperação.</p>
              <form onSubmit={handlePasswordResetSubmit} className="space-y-6">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-text" />
                  <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-background border border-card-border rounded-lg py-3 pl-12 pr-4 text-primary-text focus:outline-none focus:ring-2 focus:ring-accent-start" />
                </div>
                {successMessage && <p className="text-sm text-green-400 text-center">{successMessage}</p>}
                {formError && <p className="text-sm text-red-400 text-center">{formError}</p>}
                <button type="submit" className="w-full font-bold text-lg px-8 py-3 rounded-xl text-white bg-gradient-to-r from-accent-start to-accent-end hover:opacity-90 transition-opacity">
                  Enviar Link
                </button>
              </form>
            </div>
          ) : (
            // --- Formulário de Login/Registo ---
            <div>
              <div className="flex border-b border-card-border mb-6">
                <button onClick={() => changeView('login')} className={`flex-1 py-3 font-semibold transition-colors ${view === 'login' ? 'text-primary-text border-b-2 border-accent-start' : 'text-secondary-text'}`}>Entrar</button>
                <button onClick={() => changeView('register')} className={`flex-1 py-3 font-semibold transition-colors ${view === 'register' ? 'text-primary-text border-b-2 border-accent-start' : 'text-secondary-text'}`}>Registar</button>
              </div>
              {successMessage && <p className="text-sm text-green-400 text-center mb-4">{successMessage}</p>}
              <form onSubmit={handleAuthSubmit} className="space-y-6">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-text" />
                  <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-background border border-card-border rounded-lg py-3 pl-12 pr-4 text-primary-text focus:outline-none focus:ring-2 focus:ring-accent-start" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-text" />
                  <input type={showPassword ? 'text' : 'password'} placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-background border border-card-border rounded-lg py-3 pl-12 pr-12 text-primary-text focus:outline-none focus:ring-2 focus:ring-accent-start" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-text">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                </div>
                <div className="text-right">
                  <button type="button" onClick={() => changeView('forgotPassword')} className="text-xs text-secondary-text hover:text-primary-text font-semibold">Esqueceu a senha?</button>
                </div>
                {(error || formError) && <p className="text-sm text-red-400 text-center">{formError || 'Ocorreu um erro.'}</p>}
                <button type="submit" className="w-full font-bold text-lg px-8 py-3 rounded-xl text-white bg-gradient-to-r from-accent-start to-accent-end hover:opacity-90 transition-opacity">{view === 'login' ? 'Entrar' : 'Criar Conta'}</button>
              </form>
              <div className="flex items-center my-6">
                <hr className="flex-grow border-card-border" />
                <span className="mx-4 text-xs text-secondary-text">OU</span>
                <hr className="flex-grow border-card-border" />
              </div>
              <button onClick={loginWithGoogle} className="w-full flex items-center justify-center bg-white/5 border border-card-border text-primary-text font-semibold py-3 rounded-lg hover:bg-white/10 transition-colors"><GoogleIcon />Continuar com o Google</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
