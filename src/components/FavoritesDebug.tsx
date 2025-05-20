// src/components/FavoritesDebug.tsx - Composant de debug
import React from 'react';
import { useFavorites } from '../context/FavoritesContext';
import { Heart, RefreshCw, X } from 'lucide-react';

interface FavoritesDebugProps {
  isVisible?: boolean;
  onToggle?: () => void;
}

const FavoritesDebug: React.FC<FavoritesDebugProps> = ({ 
  isVisible = false, 
  onToggle 
}) => {
  const { 
    favorites, 
    isLoading, 
    error, 
    refreshFavorites, 
    clearError,
    removeFavorite 
  } = useFavorites();

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 left-4 p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors z-50"
        title="Ouvrir le debug des favoris"
      >
        <Heart className="w-5 h-5" />
        {favorites.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {favorites.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-md max-h-96 overflow-y-auto z-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">
          Favoris Debug
        </h3>
        <div className="flex gap-2">
          <button
            onClick={refreshFavorites}
            disabled={isLoading}
            className="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-50"
            title="Actualiser"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onToggle}
            className="p-1 text-gray-500 hover:text-red-600"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* État de chargement */}
      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="mt-2 text-sm text-gray-600">Chargement...</p>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded mb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <button
              onClick={clearError}
              className="ml-2 text-red-700 hover:text-red-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* État vide */}
      {!isLoading && favorites.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <Heart className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Aucun favori</p>
        </div>
      )}

      {/* Liste des favoris */}
      {!isLoading && favorites.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 mb-2">
            {favorites.length} favori{favorites.length > 1 ? 's' : ''}
          </p>
          {favorites.map((favorite) => (
            <div
              key={favorite.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded border"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {favorite.book_title}
                </p>
                <p className="text-xs text-gray-500">
                  Entry ID: {favorite.entry_id}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(favorite.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => removeFavorite(favorite.id)}
                className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                title="Supprimer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
        Contexte unifié • Mise à jour en temps réel
      </div>
    </div>
  );
};

export default FavoritesDebug;