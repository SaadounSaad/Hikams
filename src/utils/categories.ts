import { Category } from '../types';
import { BookOpen, Brain, Scroll, Star } from 'lucide-react';

// Catégories par défaut qui ne peuvent pas être supprimées
const defaultCategories: Category[] = [
  { id: 'verses', name: 'آيات مِفتاحية', icon: 'book-open', isDefault: true },
  { id: 'hadiths', name: 'هَدْي نَبَوي', icon: 'scroll', isDefault: true },
  { id: 'thoughts', name: 'دُرَرْ', icon: 'brain', isDefault: true },
];

export const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'book-open':
      return BookOpen;
    case 'scroll':
      return Scroll;
    case 'brain':
      return Brain;
    default:
      return Star;
  }
};

class CategoryManager {
  private static readonly STORAGE_KEY = 'custom_categories';

  getCategories(): Category[] {
    try {
      const storedCategories = localStorage.getItem(CategoryManager.STORAGE_KEY);
      const customCategories = storedCategories ? JSON.parse(storedCategories) : [];
      return [...defaultCategories, ...customCategories];
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      return defaultCategories;
    }
  }

  addCategory(category: Omit<Category, 'isDefault'>): void {
    try {
      const categories = this.getCustomCategories();
      
      // Vérifier si l'ID existe déjà
      if (categories.some(c => c.id === category.id) || defaultCategories.some(c => c.id === category.id)) {
        throw new Error('Une catégorie avec cet identifiant existe déjà');
      }

      categories.push(category);
      this.saveCategories(categories);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la catégorie:', error);
      throw error;
    }
  }

  deleteCategory(categoryId: string): void {
    try {
      // Vérifier si c'est une catégorie par défaut
      if (defaultCategories.some(c => c.id === categoryId)) {
        throw new Error('Les catégories par défaut ne peuvent pas être supprimées');
      }

      const categories = this.getCustomCategories();
      const updatedCategories = categories.filter(c => c.id !== categoryId);
      this.saveCategories(updatedCategories);
    } catch (error) {
      console.error('Erreur lors de la suppression de la catégorie:', error);
      throw error;
    }
  }

  private getCustomCategories(): Category[] {
    try {
      const storedCategories = localStorage.getItem(CategoryManager.STORAGE_KEY);
      return storedCategories ? JSON.parse(storedCategories) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories personnalisées:', error);
      return [];
    }
  }

  private saveCategories(categories: Category[]): void {
    try {
      localStorage.setItem(CategoryManager.STORAGE_KEY, JSON.stringify(categories));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des catégories:', error);
      throw error;
    }
  }
}

export const categoryManager = new CategoryManager();