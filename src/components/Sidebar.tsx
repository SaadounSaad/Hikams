// Sidebar.tsx - Modifié pour gérer la nouvelle sous-navigation
import React, { useState, useEffect } from 'react';
import { Search, Calendar, Heart, SortDesc, Settings, LogOut, BookMarked } from 'lucide-react';
import { categoryManager, getIconComponent } from '../utils/categories';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  selectedCategory: string;
  currentCategoryFilter: string;
  onCategoryChange: (category: string) => void;
  onSearch: (results: any[]) => void;
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
  const { logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Recherche
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implémentation future de la recherche
    console.log("Recherche pour:", searchTerm);
    setSearchTerm('');
  };

  // Catégories principales
  const mainCategories = [
    { id: 'daily', name: 'حكمة اليوم', icon: <Calendar className="w-5 h-5" /> },
    { id: 'mukhtarat', name: 'مختارات', icon: <BookMarked className="w-5 h-5" />, count: 829 },
    { id: 'favorites', name: 'المفضلة', icon: <Heart className="w-5 h-5" /> }
  ];

  return (
    <>
      {/* Overlay pour mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 z-20"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`fixed top-16 bottom-0 left-0 w-64 bg-white/80 backdrop-blur-sm border-r border-gray-200 z-30 transition-transform duration-300 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 flex flex-col`}
      >
        <div className="flex-1 overflow-y-auto p-4">
          {/* Recherche */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="البحث ..."
                dir="rtl"
                className="w-full pl-10 pr-4 py-2 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent font-arabic text-sm"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </form>

          {/* Catégories principales */}
          <div className="space-y-1">
            {mainCategories.map((category) => (
              <div key={category.id}>
                <button
                  onClick={() => onCategoryChange(category.id)}
                  className={`w-full flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${
                    (selectedCategory === category.id || 
                    (category.id === 'mukhtarat' && categoryManager.isMukhtaratSubCategory(selectedCategory)))
                      ? 'bg-sky-50 text-sky-600'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3 font-arabic">
                    <div className="text-gray-500">{category.icon}</div>
                    <span>{category.name}</span>
                  </div>
                  {category.count && (
                    <span 
                      className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${
                        selectedCategory === category.id || 
                        (category.id === 'mukhtarat' && categoryManager.isMukhtaratSubCategory(selectedCategory))
                          ? 'bg-sky-100 text-sky-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {category.count}
                    </span>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Tri */}
          <div className="mt-6">
            <div className="border-t border-gray-200 pt-4">
              <button
                className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <SortDesc className="text-gray-500 w-5 h-5" />
                  <span className="font-arabic">Par date</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Bas de la sidebar */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onShowSettings}
            className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Settings className="text-gray-500 w-5 h-5" />
              <span className="font-arabic">Paramètres</span>
            </div>
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 text-red-600 transition-colors"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5" />
              <span className="font-arabic">Déconnexion</span>
            </div>
          </button>
        </div>
      </nav>
    </>
  );
};