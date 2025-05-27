// src/lib/supabase.ts - Version corrigée avec diagnostics
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

console.time('Supabase Client Creation');
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false // ✅ Corrigé : detectSessionInUrl au lieu de detectSessionUrl
  }
});
console.timeEnd('Supabase Client Creation');

// Test de connexion avec timing pour diagnostic
console.time('Supabase Initial Connection');
supabase.auth.getSession().then((response) => {
  console.timeEnd('Supabase Initial Connection');
  console.log('Auth session status:', response.data.session ? 'authenticated' : 'not authenticated');
}).catch((error) => {
  console.timeEnd('Supabase Initial Connection');
  console.error('Auth connection error:', error);
});

// Types utiles exportés
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Quote = Tables<'quotes'>;
export type DailyQuote = Tables<'daily_quotes'>;
export type BookTitle = Tables<'book_titles'>;