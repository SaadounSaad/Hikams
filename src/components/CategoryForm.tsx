import React, { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { Category } from '../types';
import { categoryManager } from '../utils/categories';

interface CategoryFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({ onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    try {
      setError(null);
      setIsSubmitting(true);

      if (!name.trim()) {
        throw new Error('Le nom de la catégorie est requis');
      }

      const categoryId = name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const newCategory: Omit<Category, 'isDefault'> = {
        id: categoryId,
        name: name.trim(),
        icon: 'star',
      };

      categoryManager.addCategory(newCategory);
      onSuccess();
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium">Nouvelle catégorie</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500 p-2 hover:bg-gray-50 rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-100">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-arabic text-gray-700 mb-1">
            Nom de la catégorie
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            placeholder="Ex: Poésie, Sagesse..."
            maxLength={50}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-arabic text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            {isSubmitting ? 'Création...' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  );
};