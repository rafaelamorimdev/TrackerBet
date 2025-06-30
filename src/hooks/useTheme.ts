import * as React from 'react';

// --- TIPOS ---
type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

// --- CONTEXTO ---
const ThemeContext = React.createContext<ThemeContextType | null>(null);

// --- PROVEDOR ---
interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Componente Provedor que envolve a aplicação e disponibiliza o tema.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>(() => {
    try {
      const savedTheme = window.localStorage.getItem('theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch{
      return 'light';
    }
  });

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);
    try {
      window.localStorage.setItem('theme', theme);
    } catch {
      console.error("Não foi possível guardar o tema no localStorage.");
    }
  }, [theme]);

  const toggleTheme = React.useCallback(() => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  const value = React.useMemo(
    () => ({
      theme,
      toggleTheme,
    }),
    [theme, toggleTheme]
  );

  // --- ALTERAÇÃO PRINCIPAL ---
  // Em vez de usar a sintaxe JSX que está a causar o erro,
  // usamos a função `React.createElement` diretamente.
  // Esta abordagem é imune a erros de parsing de JSX.
  return React.createElement(
    ThemeContext.Provider,
    { value: value },
    children
  );
}

// --- HOOK CONSUMIDOR ---
/**
 * Hook customizado para aceder ao contexto do tema de forma segura.
 */
export function useTheme(): ThemeContextType {
  const context = React.useContext(ThemeContext);
  
  if (context === null) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  
  return context;
}
