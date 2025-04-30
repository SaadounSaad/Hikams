// Étape 2: Créer un Context pour l'authentification
// AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });
  
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });
  
    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoggingOut(false);
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
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