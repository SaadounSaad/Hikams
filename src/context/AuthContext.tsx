// AuthContext.tsx CORRIGÉ - avec objet user et client Supabase
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User, SupabaseClient } from '@supabase/supabase-js';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  supabase: SupabaseClient; // ← AJOUTÉ: Client Supabase
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔄 Auth state changed:', { event: _event, hasSession: !!session });
      setIsAuthenticated(!!session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Récupérer la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔄 Initial session:', { hasSession: !!session, userId: session?.user?.id });
      setIsAuthenticated(!!session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    if (isLoggingOut) return;
   
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      // Le onAuthStateChange se chargera de mettre à jour les états
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoggingOut(false);
      window.location.href = '/';
    }
  };

  // Log pour debug
  useEffect(() => {
    console.log('👤 Auth Context State:', {
      isAuthenticated,
      isLoading,
      userId: user?.id,
      userEmail: user?.email
    });
  }, [isAuthenticated, isLoading, user]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        supabase, // ← AJOUTÉ: Exposer le client Supabase
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};