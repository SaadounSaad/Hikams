// 2. src/utils/themes.ts - Correction de l'interface Theme
import { Theme } from '../types';

export const themes: Theme[] = [
  {
    id: 'blue',
    name: 'Bleu',
    primary: 'from-sky-600 to-cyan-600',
    colors: {
      primary: '#0ea5e9',
      secondary: '#06b6d4',
      background: '#ffffff',
      text: '#1f2937'
    },
    isDark: false
  },
  {
    id: 'green',
    name: 'Vert',
    primary: 'from-emerald-600 to-teal-600',
    colors: {
      primary: '#10b981',
      secondary: '#14b8a6',
      background: '#ffffff',
      text: '#1f2937'
    },
    isDark: false
  },
  {
    id: 'orange',
    name: 'Orange',
    primary: 'from-amber-600 to-orange-600',
    colors: {
      primary: '#f59e0b',
      secondary: '#ea580c',
      background: '#ffffff',
      text: '#1f2937'
    },
    isDark: false
  }
];