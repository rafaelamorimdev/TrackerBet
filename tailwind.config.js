/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', 
  theme: {
    extend: {
      colors: {
        
        background: '#0A0A0A', 
        foreground: '#EAEAEA', 
        card: '#111111', 
        'card-border': '#262626', 
        'primary-text': '#FFFFFF',
        'secondary-text': '#A1A1A1',

        
        accent: {
          start: '#38BDF8', // Ciano
          end: '#A78BFA',   // Roxo
        },
      },
    },
  },
  plugins: [],
}
