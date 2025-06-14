import { Category } from '../types';
import { BookOpen, Brain, Scroll, Star, BookMarked } from 'lucide-react';
import { Quote } from '../types';

interface SubCategory {
  id: string;
  name: string;
  parentId: string;
}
export const getMukhtaratSubCategories = () => {
  return [
    { id: 'verses', name: 'آيات مِفتاحية', icon: 'book-open' },
    { id: 'hadiths', name: 'هَدْي نَبَوي', icon: 'book' },
    { id: 'thoughts', name: 'دُرَرْ', icon: 'pen-line' }
  ];
};

export const countQuotesInMukhtarat = (quotes: Quote[]): number => {
  const subCategoryIds = getMukhtaratSubCategories().map(sub => sub.id);
  return quotes.filter(q => subCategoryIds.includes(q.category)).length;
};


// Types étendus pour gérer les sous-catégories
interface ExtendedCategory extends Category {
  count?: number;
  parentId?: string;
  hasSubCategories?: boolean;
}

// Catégories par défaut qui ne peuvent pas être supprimées
const defaultCategories: ExtendedCategory[] = [
  { id: 'verses', name: 'آيات مِفتاحية', icon: 'book-open', isDefault: true, parentId: 'mukhtarat' },
  { id: 'hadiths', name: 'هَدْي نَبَوي', icon: 'scroll', isDefault: true, parentId: 'mukhtarat' },
  { id: 'thoughts', name: 'دُرَرْ', icon: 'brain', isDefault: true, parentId: 'mukhtarat' },
];

// Catégories principales du système
const mainCategories: ExtendedCategory[] = [
    { id: 'miraj-arwah', name: 'معراج الأرواح', icon: 'Star', isDefault: true, hasSubCategories: true },
  { id: 'daily', name: 'حكمة اليوم', icon: 'calendar', isDefault: true },
  { id: 'mukhtarat', name: 'مختارات', icon: 'bookmarks', isDefault: true, hasSubCategories: true } ,

  { id: 'favorites', name: 'المفضلة', icon: 'heart', isDefault: true },
];
const mirajSubCategories: SubCategory[] = [
  { id: 'wird', name: 'الورد اليومي', parentId: 'miraj-arwah' },
  { id: 'azkar', name: 'أذكار الصباح و المساء', parentId: 'miraj-arwah' },
  // Ajoutez les autres boutons comme sous-catégories
];


export const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'book-open':
      return BookOpen;
    case 'scroll':
      return Scroll;
    case 'brain':
      return Brain;
    case 'bookmarks':
      return BookMarked;
    default:
      return Star;
  }
};

class CategoryManager {
  private static readonly STORAGE_KEY = 'custom_categories';

  // Méthodes pour obtenir les différentes catégories
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

  // Nouvelles méthodes pour la gestion des catégories principales et sous-catégories
  getMainCategories(): ExtendedCategory[] {
    return mainCategories;
  }

  getMukhtaratSubCategories(): ExtendedCategory[] {
    return defaultCategories;
  }

  getAllCategories(): ExtendedCategory[] {
    try {
      const customCategories = this.getCustomCategories();
      return [...mainCategories, ...defaultCategories, ...customCategories];
    } catch (error) {
      console.error('Erreur lors de la récupération de toutes les catégories:', error);
      return [...mainCategories, ...defaultCategories];
    }
  }

  // Méthodes pour vérifier les relations entre catégories
  isMukhtaratSubCategory(categoryId: string): boolean {
    return defaultCategories.some(cat => cat.id === categoryId && cat.parentId === 'mukhtarat');
  }

  getParentCategory(categoryId: string): string | null {
    const allCategories = this.getAllCategories();
    const category = allCategories.find(cat => cat.id === categoryId);
    return category?.parentId || null;
  }

  getCategoryName(categoryId: string): string {
    const allCategories = this.getAllCategories();
    const category = allCategories.find(cat => cat.id === categoryId);
    
    if (category) {
      return category.name;
    }
    
    // Fallback pour les catégories spéciales
    switch (categoryId) {
      case 'daily':
        return 'حكمة اليوم';
      case 'all':
        return '';
      case 'favorites':
        return 'المفضلة';
      case 'mukhtarat':
        return 'مختارات';
      default:
        return 'حكم الموردين';
    }
  }

  // Méthodes existantes pour la gestion des catégories personnalisées
  addCategory(category: Omit<Category, 'isDefault'>): void {
    try {
      const categories = this.getCustomCategories();
     
      // Vérifier si l'ID existe déjà
      if (categories.some(c => c.id === category.id) || 
          defaultCategories.some(c => c.id === category.id) ||
          mainCategories.some(c => c.id === category.id)) {
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
      if (defaultCategories.some(c => c.id === categoryId) || 
          mainCategories.some(c => c.id === categoryId)) {
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

  // Méthodes privées pour la manipulation des données
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