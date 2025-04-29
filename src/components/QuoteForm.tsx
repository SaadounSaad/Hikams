import React, { useState } from 'react';
import { Quote } from '../types';
import { storage } from '../utils/storage';
import { notificationService } from '../services/notificationService';
import { Plus, AlertCircle } from 'lucide-react';
import { categoryManager } from '../utils/categories';

interface QuoteFormProps {
  onSubmit: () => void;
  editQuote?: Quote;
  onClose: () => void;
}

export const QuoteForm: React.FC<QuoteFormProps> = ({ onSubmit, editQuote, onClose }) => {
  const [activeTab, setActiveTab] = useState<'quote' | 'categories'>('quote');
  const [quote, setQuote] = useState({
    text: editQuote?.text || '',
    category: editQuote?.category || 'thoughts',
    source: editQuote?.source || '',
    scheduledDate: editQuote?.scheduledDate 
      ? new Date(editQuote.scheduledDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categories, setCategories] = useState(categoryManager.getCategories());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    try {
      setError(null);
      setIsSubmitting(true);

      if (!quote.text.trim()) {
        throw new Error('Le texte de la citation est requis');
      }

      const scheduledDate = new Date(quote.scheduledDate);
      scheduledDate.setHours(12, 0, 0, 0);

      const newQuote: Quote = {
        id: editQuote?.id || crypto.randomUUID(),
        text: quote.text.trim(),
        category: quote.category,
        source: quote.source.trim(),
        isFavorite: editQuote?.isFavorite || false,
        createdAt: editQuote?.createdAt || new Date().toISOString(),
        scheduledDate: scheduledDate.toISOString(),
      };

      if (editQuote) {
        await storage.updateQuote(newQuote);
      } else {
        await storage.saveQuote(newQuote);
      }

      notificationService.scheduleQuoteNotification(newQuote);
      onSubmit();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCategory = () => {
    try {
      if (!newCategory.trim()) {
        throw new Error('Le nom de la catégorie est requis');
      }

      const categoryId = newCategory.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      categoryManager.addCategory({
        id: categoryId,
        name: newCategory.trim(),
        icon: 'star',
      });

      setCategories(categoryManager.getCategories());
      setNewCategory('');
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    try {
      categoryManager.deleteCategory(categoryId);
      setCategories(categoryManager.getCategories());
      if (quote.category === categoryId) {
        setQuote(prev => ({ ...prev, category: 'thoughts' }));
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 grid grid-cols-2 gap-2">
          <button
            onClick={() => setActiveTab('quote')}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
              activeTab === 'quote'
                ? 'bg-sky-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Ajouter Citation
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
              activeTab === 'categories'
                ? 'bg-sky-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Catégories
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-100">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {activeTab === 'quote' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-1">
              Citation
            </label>
            <textarea
              id="text"
              value={quote.text}
              onChange={(e) => setQuote(prev => ({ ...prev, text: e.target.value }))}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              rows={4}
              placeholder="Entrez votre citation..."
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie
            </label>
            <select
              id="category"
              value={quote.category}
              onChange={(e) => setQuote(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
              Source
            </label>
            <input
              type="text"
              id="source"
              value={quote.source}
              onChange={(e) => setQuote(prev => ({ ...prev, source: e.target.value }))}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="Auteur, livre, etc."
            />
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date de programmation
            </label>
            <input
              type="date"
              id="date"
              value={quote.scheduledDate}
              onChange={(e) => setQuote(prev => ({ ...prev, scheduledDate: e.target.value }))}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? 'Enregistrement...' : editQuote ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="Nouvelle catégorie..."
            />
            <button
              onClick={handleAddCategory}
              className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors"
            >
              Ajouter
            </button>
          </div>

          <div className="space-y-2">
            {categories.map(category => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50"
              >
                <span className="font-medium">{category.name}</span>
                {!category.isDefault && (
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-red-500 hover:text-red-600 text-sm"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};