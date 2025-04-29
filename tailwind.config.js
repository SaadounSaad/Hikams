/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        arabic: ["'Amiri'", "serif"], // Ajoute une police arabe personnalisée
      },
    },
  },
  plugins: [],
};
