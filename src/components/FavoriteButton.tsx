import React from 'react';
import { Star, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFavorite } from '../hooks/useFavorites';
import { ContentType } from '../services/FavoritesServices';

interface FavoriteButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  contentId: string;
  contentType: ContentType;
  initialIsFavorite?: boolean;
  category?: string;
  index?: number;
  onToggleComplete?: (isFavorite: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  contentId,
  contentType,
  initialIsFavorite,
  category,
  index,
  onToggleComplete,
  className = '',
  variant = 'ghost',
  size = 'md',
  ...props
}) => {
  const { user } = useAuth();
  const { isFavorite, isLoading, toggleFavorite } = useFavorite({
    contentId,
    contentType,
    initialIsFavorite,
  });

  const handleToggle = async () => {
    if (!user) return;
    
    await toggleFavorite(category, index, () => {
      if (onToggleComplete) {
        onToggleComplete(!isFavorite);
      }
    });
  };

  // Déterminer les tailles en fonction du paramètre size
  const iconSize = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';
  
  // Classes de base pour le bouton
  let buttonClasses = 'rounded-full flex items-center justify-center focus:outline-none transition-colors ';
  
  // Ajouter les classes selon le variant
  if (variant === 'ghost') {
    buttonClasses += 'bg-transparent hover:bg-gray-100/50 ';
  } else if (variant === 'outline') {
    buttonClasses += 'bg-transparent border border-gray-300 hover:bg-gray-100/50 ';
  } else {
    buttonClasses += 'bg-primary text-white hover:bg-primary-dark ';
  }
  
  // Ajouter les classes selon la taille
  if (size === 'sm') {
    buttonClasses += 'h-8 w-8 ';
  } else if (size === 'lg') {
    buttonClasses += 'h-10 w-10 ';
  } else {
    buttonClasses += 'h-9 w-9 ';
  }
  
  // Combiner avec les classes personnalisées
  buttonClasses += className;

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={buttonClasses}
      disabled={isLoading}
      title={isFavorite ? 'حذف من المفضلة' : 'إضافة إلى المفضلة'}
      {...props}
    >
      {isLoading ? (
        <Loader2 className={`${iconSize} animate-spin`} />
      ) : isFavorite ? (
        <Star className={`${iconSize} fill-yellow-400 text-yellow-400`} />
      ) : (
        <Star className={`${iconSize} text-gray-400 hover:text-gray-600`} />
      )}
    </button>
  );
};

export default FavoriteButton;