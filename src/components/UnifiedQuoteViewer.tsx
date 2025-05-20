// UnifiedQuoteViewer.tsx - Composant pour afficher les favoris unifiés
import React from 'react';
import { ChevronLeft, ChevronRight, Heart, Edit, Trash2, BookOpen, Share2 } from 'lucide-react';
import { Quote } from '../types';

interface UnifiedQuoteViewerProps {
  quotes: Quote[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  selectedCategory: string;
  onToggleFavorite: (id: string) => void;
  onEdit?: (quote: Quote) => void;
  onDelete?: (id: string) => void;
  onNavigateToBook?: (bookTitle: string, ordre: number) => void;
}

const UnifiedQuoteViewer: React.FC<UnifiedQuoteViewerProps> = ({
  quotes,
  currentIndex,
  onIndexChange,
  selectedCategory,
  onToggleFavorite,
  onEdit,
  onDelete,
  onNavigateToBook
}) => {
  const currentQuote = quotes[currentIndex];

  if (!currentQuote) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="font-arabic">لا توجد عناصر للعرض</p>
      </div>
    );
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < quotes.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  };

  const isBookEntry = currentQuote.isBookEntry;

  return (
    <div className="relative">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          title="السابق"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="font-arabic">
            {selectedCategory === 'favorites' ? 'المفضلة' : 'العنصر'}
          </span>
          <span>({currentIndex + 1}</span>
          <span>/</span>
          <span>{quotes.length})</span>
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === quotes.length - 1}
          className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          title="التالي"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Contenu principal */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* 🆕 En-tête spécial pour les favoris de livre */}
        {isBookEntry && (
          <div className="bg-blue-50 border-b border-blue-100 px-6 py-3">
            <div className="flex items-center gap-2 text-blue-700">
              <BookOpen className="w-4 h-4" />
              <span className="font-medium font-arabic">{currentQuote.bookTitle}</span>
              {currentQuote.ordre && (
                <span className="text-sm opacity-75">
                  — الترتيب {currentQuote.ordre}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Contenu */}
        <div className="p-6">
          <div className="prose prose-lg max-w-none">
            <p 
              className="text-gray-800 font-arabic leading-relaxed text-lg"
              dir="rtl"
              style={{ fontFamily: 'Arabic, serif' }}
            >
              {currentQuote.text}
            </p>

            {/* Source */}
            {(currentQuote.source || isBookEntry) && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 font-arabic italic" dir="rtl">
                  {currentQuote.source || `— ${currentQuote.bookTitle}`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {/* Bouton favori */}
              <button
                onClick={() => onToggleFavorite(currentQuote.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  currentQuote.isFavorite
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
                title={currentQuote.isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
              >
                <Heart 
                  className="w-4 h-4" 
                  fill={currentQuote.isFavorite ? 'currentColor' : 'none'} 
                />
                <span className="font-arabic text-sm">
                  {currentQuote.isFavorite ? 'مُفضل' : 'إضافة'}
                </span>
              </button>

              {/* Actions spécifiques selon le type */}
              {isBookEntry ? (
                <button
                  onClick={() => onNavigateToBook?.(currentQuote.bookTitle!, currentQuote.ordre!)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                  title="فتح في الكتاب"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="font-arabic text-sm">فتح الكتاب</span>
                </button>
              ) : (
                <>
                  {/* Édition pour les quotes seulement */}
                  {onEdit && (
                    <button
                      onClick={() => onEdit(currentQuote)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                      title="تعديل"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="font-arabic text-sm">تعديل</span>
                    </button>
                  )}

                  {/* Suppression pour les quotes seulement */}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(currentQuote.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="font-arabic text-sm">حذف</span>
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Partage (optionnel) */}
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: isBookEntry ? currentQuote.bookTitle : 'حكمة',
                    text: currentQuote.text
                  });
                } else {
                  navigator.clipboard.writeText(currentQuote.text);
                }
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
              title="مشاركة"
            >
              <Share2 className="w-4 h-4" />
              <span className="font-arabic text-sm">مشاركة</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🆕 Notes (pour rester compatible avec l'interface existante) */}
      <div className="mt-6">
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer text-blue-600 hover:text-blue-700 font-arabic">
            <span>📝 ملاحظاتي</span>
            <ChevronLeft className="w-4 h-4 transform group-open:rotate-90 transition-transform" />
          </summary>
          <div className="mt-3 p-4 bg-gray-50 rounded-lg">
            <textarea
              className="w-full p-3 border border-gray-200 rounded-lg font-arabic"
              rows={4}
              placeholder="أضف ملاحظاتك هنا..."
              dir="rtl"
            />
            <div className="flex justify-end mt-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-arabic">
                حفظ
              </button>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default UnifiedQuoteViewer;