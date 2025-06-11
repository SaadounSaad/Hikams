import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

interface KPIs {
  current_favorites: number;
  total_quotes: number;
  events_last_30d: number;
  sessions_last_30d: number;
  top_category: string;
  last_activity: string;
}

export const useKPIs = () => {
  const { supabase, user } = useAuth();
  const [data, setData] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !user || loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data: result, error: err } = await supabase
        .rpc('get_complete_kpis')
        .single();
      
      if (err) throw err;
      
      // Validation silencieuse
      if (result && 
          typeof result.current_favorites === 'number' &&
          typeof result.total_quotes === 'number' &&
          typeof result.events_last_30d === 'number' &&
          typeof result.sessions_last_30d === 'number' &&
          typeof result.top_category === 'string' &&
          typeof result.last_activity === 'string') {
        setData(result);
      } else {
        throw new Error('Format de données invalide');
      }
    } catch (e: any) {
      setError(e.message || 'Erreur de chargement');
      // Pas de console.error - silencieux
    } finally {
      setLoading(false);
    }
  }, [supabase, user, loading]);

  // Données formatées
  const formatted = data ? {
    ...data,
    current_favorites_formatted: data.current_favorites.toLocaleString('ar-MA'),
    total_quotes_formatted: data.total_quotes.toLocaleString('ar-MA'),
    events_last_30d_formatted: data.events_last_30d.toLocaleString('ar-MA'),
    sessions_last_30d_formatted: data.sessions_last_30d.toLocaleString('ar-MA'),
    last_activity_formatted: new Date(data.last_activity).toLocaleDateString('ar-MA', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    }),
    engagement_rate: data.total_quotes > 0 ? 
      ((data.current_favorites / data.total_quotes) * 100).toFixed(2) : '0',
    avg_events_per_session: data.sessions_last_30d > 0 ? 
      (data.events_last_30d / data.sessions_last_30d).toFixed(1) : '0',
    activity_level: data.events_last_30d > 50 ? 'نشط جداً' : 
                   data.events_last_30d > 20 ? 'نشط' : 'هادئ',
    activity_emoji: data.events_last_30d > 50 ? '🔥' : 
                   data.events_last_30d > 20 ? '⚡' : '💤'
  } : null;

  return { data, formatted, loading, error, load };
};