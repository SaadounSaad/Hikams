
import React, { useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { favoritesService } from '../services/FavoritesService';

const MigrationPage: React.FC = () => {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour créer la table des favoris
  const createFavoritesTable = async () => {
    try {
      // Vérifier si la table existe déjà
      const { error: checkError } = await supabase
        .from('favorites')
        .select('id')
        .limit(1);
      
      // Si pas d'erreur, la table existe déjà
      if (!checkError) {
        return;
      }

      // Création de la table des favoris via SQL
      const { error } = await supabase.rpc('execute_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS favorites (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            content_type TEXT NOT NULL,
            content_id UUID NOT NULL,
            createdAt TIMESTAMP WITH TIME ZONE DEFAULT now(),
            notes TEXT,
            UNIQUE(user_id, content_type, content_id)
          );
          
          -- Ajouter les politiques RLS (Row Level Security)
          ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
          
          -- Politique pour lire seulement ses propres favoris
          CREATE POLICY select_own_favorites ON favorites
          FOR SELECT USING (auth.uid() = user_id);
          
          -- Politique pour insérer ses propres favoris
          CREATE POLICY insert_own_favorites ON favorites
          FOR INSERT WITH CHECK (auth.uid() = user_id);
          
          -- Politique pour supprimer ses propres favoris
          CREATE POLICY delete_own_favorites ON favorites
          FOR DELETE USING (auth.uid() = user_id);
          
          -- Politique pour mettre à jour ses propres favoris
          CREATE POLICY update_own_favorites ON favorites
          FOR UPDATE USING (auth.uid() = user_id);
        `
      });

      if (error) {
        // Si la fonction RPC n'existe pas, on peut essayer d'exécuter le SQL directement 
        // avec le service role key dans une application admin
        console.error('Erreur lors de la création de la table:', error);
      }
    } catch (err) {
      console.error('Erreur lors de la création de la table:', err);
      throw err;
    }
  };

  // Fonction pour migrer les données
  const migrateData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Tenter de créer la table si elle n'existe pas
      await createFavoritesTable();
      
      // 2. Migrer les données de l'utilisateur
      const result = await favoritesService.migrateOldFavorites(user.id);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      setSuccess(true);
    } catch (err) {
      console.error('Erreur lors de la migration:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la migration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4" dir="rtl">
      <div className="mb-4">
        <Link to="/favorites" className="flex items-center text-primary">
          <ArrowLeft className="h-5 w-5 ml-1" />
          العودة إلى المفضلة
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md max-w-md mx-auto">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold">نقل البيانات إلى نظام المفضلة الجديد</h1>
        </div>

        <div className="p-6">
          <p className="mb-4">
            ستقوم هذه الأداة بنقل المفضلات الحالية إلى النظام الموحد الجديد.
            لن يتم فقدان أي بيانات أثناء هذه العملية.
          </p>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 ml-2" />
                <h3 className="font-medium text-red-700">خطأ</h3>
              </div>
              <p className="mt-1 text-red-600">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 ml-2" />
                <h3 className="font-medium text-green-700">نجاح</h3>
              </div>
              <p className="mt-1 text-green-600">تم نقل البيانات بنجاح!</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <button 
            onClick={migrateData} 
            disabled={isLoading || success}
            className={`w-full py-2 px-4 rounded-md font-medium text-white ${
              isLoading || success 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-primary hover:bg-primary-dark'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جارٍ النقل...
              </div>
            ) : success ? (
              <div className="flex items-center justify-center">
                <CheckCircle className="ml-2 h-4 w-4" />
                تم النقل بنجاح
              </div>
            ) : (
              'بدء عملية النقل'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MigrationPage;