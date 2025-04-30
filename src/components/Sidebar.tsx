import React from 'react';
import { Settings, Library, BookOpen } from 'lucide-react';

interface SidebarProps {
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenSettings }) => {
  return (
    <aside
      className="
        h-full w-64 p-4 flex flex-col gap-6 
        theme-clair:bg-white 
        theme-sombre:bg-gray-900 
        theme-sepia:bg-[#f4ecd8] 
        theme-clair:text-black 
        theme-sombre:text-white 
        theme-sepia:text-[#4a382d]
        border-r border-gray-200
        transition-colors
      "
    >
      <h2 className="text-xl font-semibold mb-4">📚 Citations</h2>

      <nav className="flex flex-col gap-2 text-sm">
        <button className="flex items-center gap-2 hover:underline">
          <Library className="w-4 h-4" />
          Accueil
        </button>
        <button className="flex items-center gap-2 hover:underline">
          <BookOpen className="w-4 h-4" />
          Mes catégories
        </button>
        <button onClick={onOpenSettings} className="flex items-center gap-2 hover:underline">
          <Settings className="w-4 h-4" />
          Paramètres
        </button>
      </nav>
    </aside>
  );
};
