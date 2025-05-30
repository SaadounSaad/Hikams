// Nouveau composant BottomNavBar pour menu en bas de page

import { Calendar, Star, Heart, Settings, LogOut } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { Search, SortDesc, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type SidebarProps = {
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  onShowSettings: () => void;
  onLogout: () => void;
};
export function BottomNavBar({
  selectedCategory,
  onCategoryChange,
  onShowSettings,
  onLogout
}: SidebarProps) {

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-gray-200 flex justify-around items-center h-16 shadow-xl md:hidden">
      {/* Icônes & libellés */}
      <button
        onClick={() => onCategoryChange('daily')}
        className={`flex flex-col items-center gap-1 px-3 py-2 focus:outline-none ${selectedCategory === 'daily' ? 'text-sky-600' : 'text-gray-600 hover:text-sky-500'}`}
        title="حكمة اليوم"
      >
        <Calendar className="w-6 h-6" />
        <span className="text-xs font-arabic">اليوم</span>
      </button>
      <button
        onClick={() => onCategoryChange('mukhtarat')}
        className={`flex flex-col items-center gap-1 px-3 py-2 focus:outline-none ${selectedCategory === 'mukhtarat' ? 'text-sky-600' : 'text-gray-600 hover:text-sky-500'}`}
        title="عٌدَّة المريد"
      >
        <Star className="w-6 h-6" />
        <span className="text-xs font-arabic">عدة</span>
      </button>
      <button
        onClick={() => onCategoryChange('favorites')}
        className={`flex flex-col items-center gap-1 px-3 py-2 focus:outline-none ${selectedCategory === 'favorites' ? 'text-sky-600' : 'text-gray-600 hover:text-sky-500'}`}
        title="المفضلة"
      >
        <Heart className="w-6 h-6" />
        <span className="text-xs font-arabic">المفضلة</span>
      </button>
      <button
        onClick={onShowSettings}
        className="flex flex-col items-center gap-1 px-3 py-2 text-gray-600 hover:text-sky-500 focus:outline-none"
        title="Paramètres"
      >
        <Settings className="w-6 h-6" />
        <span className="text-xs font-arabic">إعدادات</span>
      </button>
      <button
        onClick={onLogout}
        className="flex flex-col items-center gap-1 px-3 py-2 text-red-500 hover:text-red-700 focus:outline-none"
        title="Déconnexion"
      >
        <LogOut className="w-6 h-6" />
        <span className="text-xs font-arabic">خروج</span>
      </button>
    </nav>
  );
}
