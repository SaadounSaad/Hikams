// wirdService.ts
import { supabase } from '../lib/supabase'; // Ajustez le chemin selon votre structure

export interface Wird {
  id: string;
  jour: number; // 1-7
  texte: string;
}

export async function getWirdByDay(day: number): Promise<Wird | null> {
  try {
    const { data, error } = await supabase
      .from('Wird')
      .select('*')
      .eq('jour', day)
      .single();

    if (error) {
      console.error('Erreur Supabase:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération du Wird:', error);
    return null;
  }
}

export function getCurrentDayNumber(): number {
  const today = new Date().getDay(); // 0 = dimanche, 1 = lundi...
  return today === 0 ? 7 : today; // Convertir dimanche (0) en 7 si votre système utilise 1-7
}

export function getDayNameInArabic(dayNumber: number): string {
  const arabicDays = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  // Ajuster l'index selon votre système (0-6 ou 1-7)
  const index = dayNumber === 7 ? 0 : dayNumber % 7;
  return arabicDays[index];
}