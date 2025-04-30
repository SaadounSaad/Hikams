// Étape 3: Créer des composants plus spécifiques
// Sidebar.tsx
import React, { useRef } from 'react';
import { Sun, Library, Heart, SortAsc, Settings, LogOut } from 'lucide-react';
import { useQuotes } from '../contexts/QuoteContext';
import { useAuth } from '../contexts/AuthContext';
import { SearchBar, SearchBarRef } from './SearchBar';
import { categoryManager } from '../utils/categories';
import { Quote } from '../types';

interface SidebarProps {
  selectedCategory: string;
  currentCategoryFilter: string;
  onCategoryChange: (category: string) => void;
  onSearch: (results: Quote[]) => void;
  isOpen: boolean;
  onClose: () => void;
  onShowSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedCategory,
  currentCategoryFilter,
  onCategoryChange,
  onSearch,
  isOpen,
  onClose,
  onShowSettings
}) => {
  const { quotes, sortOrder, setSortOrder } = useQuotes();
  const { logout } = useAuth();
  const searchBarRef = useRef<SearchBarRef>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const getCategoryCount = (categoryId: string): number => {
    const { quotes, dailyQuotes } = useQuotes();
    if (categoryId === 'daily') return dailyQuotes.length;
    if (categoryId === 'all') return quotes.length;
    if (categoryId === 'favorites') return quotes.filter(q => q.isFavorite).length;
    return quotes.filter(q => q.category === categoryId).length;
  };

  const shouldShowCounter = (categoryId: string): boolean => {
    return ['daily', 'all', 'favorites'].includes(categoryId);
  };

  const handleCategoryChange = (category: string) => {
    if (searchBarRef.current?.hasSearchTerm()) {
      searchBarRef.current.clear();
    }
    onCategoryChange(category);
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(e.target.value as typeof sortOrder);
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <nav 
      ref={menuRef}
      className={`fixed md:static top-16 bottom-0 left-0 w-72 bg-white/80 backdrop-blur-sm shadow-lg transform transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} z-20 flex flex-col`}
    >
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div className="mb-2">
          <SearchBar ref={searchBarRef} quotes={quotes} onSearch={onSearch} />
        </div>

        {[
          { id: 'daily', icon: Sun, label: 'حكمة اليوم' },
          { id: 'all', icon: Library, label: 'مختارات' },
          { id: 'favorites', icon: Heart, label: 'المفضلة' }
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => handleCategoryChange(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-arabic rounded-xl transition-all duration-200 ${
              selectedCategory === id 
                ? 'text-sky-600 bg-sky-50/80 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/80'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="flex-1">{label}</span>
            {shouldShowCounter(id) && (
              <span className="px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                {getCategoryCount(id)}
              </span>
            )}
          </button>
        ))}

        {categoryManager.getCategories().map(category => (
          <button
            key={category.id}
            onClick={() => handleCategoryChange(category.id)}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-arabic rounded-xl transition-all duration-200 ${
              (selectedCategory === category.id || (selectedCategory === 'all' && currentCategoryFilter === category.id))
                ? 'text-sky-600 bg-sky-50/80 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/80'
            }`}
          >
            <span className="flex-1">{category.name}</span>
            <span className="px-2 py-0.5 text-xs bg-gray-100 rounded-full">
              {quotes.filter(q => q.category === category.id).length}
            </span>
          </button>
        ))}
      </div>
      
      <div className="p-4 border-t border-gray-200/50 space-y-3 bg-gray-50/50">
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/70">
          <SortAsc className="w-5 h-5 text-gray-500" />
          <select
            value={sortOrder}
            onChange={handleSortChange}
            className="flex-1 text-sm bg-transparent border-none focus:ring-0"
          >
            <option value="scheduled">Par date</option>
            <option value="newest">Plus récentes</option>
            <option value="oldest">Plus anciennes</option>
            <option value="random">Aléatoire</option>
          </select>
        </div>
        
        <button
          onClick={() => {
            onShowSettings();
            onClose();
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100/50 hover:bg-gray-200/50 rounded-xl transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span className="flex-1">Paramètres</span>
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50/50 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </nav>
  );
};