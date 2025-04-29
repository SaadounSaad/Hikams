import { Theme } from '../types';

export const themes: Theme[] = [
  {
    id: 'default',
    name: 'Quran',
    primary: 'from-sky-600 to-cyan-600',
    secondary: 'text-sky-600 bg-sky-50',
    background: 'from-slate-50 to-white',
    text: 'text-sky-600'
  },
  {
    id: 'emerald',
    name: 'Émeraude',
    primary: 'from-emerald-600 to-teal-600',
    secondary: 'text-emerald-600 bg-emerald-50',
    background: 'from-emerald-50 to-white',
    text: 'text-emerald-600'
  },
  {
    id: 'amber',
    name: 'Ambre',
    primary: 'from-amber-600 to-orange-600',
    secondary: 'text-amber-600 bg-amber-50',
    background: 'from-amber-50 to-white',
    text: 'text-amber-600'
  }
];

export const getTheme = (themeId: string): Theme => {
  return themes.find(theme => theme.id === themeId) || themes[0];
};