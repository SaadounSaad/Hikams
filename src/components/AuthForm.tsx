import React, { useState } from 'react';
import { Mail, Lock, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;
        else {
          setError('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
          setIsLogin(true);
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-2xl font-semibold text-center mb-8">
        {isLogin ? 'Connexion' : 'Créer un compte'}
      </h1>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="votre@email.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Mot de passe
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader className="w-5 h-5 mx-auto animate-spin" />
          ) : (
            isLogin ? 'Se connecter' : 'Créer un compte'
          )}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}{' '}
        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setError(null);
          }}
          className="text-sky-600 hover:text-sky-700 font-medium"
        >
          {isLogin ? "S'inscrire" : "Se connecter"}
        </button>
      </p>
    </div>
  );
};