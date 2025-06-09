// ===========================================
// 4. Partage de recherches
// ===========================================

// src/components/SearchShare.tsx
import { useState } from 'react';
import { Share2, Link, Copy, Check } from 'lucide-react';

interface SearchShareProps {
  searchQuery: string;
  resultsCount: number;
  className?: string;
}

export function SearchShare({ searchQuery, resultsCount, className = "" }: SearchShareProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/search?q=${encodeURIComponent(searchQuery)}`;
  const shareText = `وجدت ${resultsCount} حكمة عن "${searchQuery}" في مكتبة حكم`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erreur copie:', error);
    }
  };

  const shareViaWebAPI = async () => {
    // ✅ CORRECTION : Vérification correcte de l'API Web Share
    if ('share' in navigator && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'مكتبة الحكم',
          text: shareText,
          url: shareUrl
        });
      } catch (error) {
        console.error('Erreur partage:', error);
      }
    }
  };

  const shareViaWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaTelegram = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(telegramUrl, '_blank');
  };

  if (!searchQuery || resultsCount === 0) return null;

  // Vérifier si l'API Web Share est disponible
  const isWebShareSupported = 'share' in navigator && typeof navigator.share === 'function';

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        title="مشاركة النتائج"
      >
        <Share2 className="w-4 h-4" />
        <span className="text-sm font-arabic">مشاركة</span>
      </button>

      {showOptions && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-50 min-w-64">
          <h3 className="text-sm font-medium text-gray-900 mb-3 font-arabic">
            مشاركة نتائج البحث
          </h3>

          {/* URL */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Link className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 font-arabic">رابط البحث</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-2 py-1 text-xs bg-white border border-gray-300 rounded"
              />
              <button
                onClick={copyToClipboard}
                className="p-1 text-gray-500 hover:text-gray-700"
                title="نسخ الرابط"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Options de partage */}
          <div className="space-y-2">
            {/* ✅ CORRECTION : Partage natif avec vérification correcte */}
            {isWebShareSupported && (
              <button
                onClick={shareViaWebAPI}
                className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Share2 className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-arabic">مشاركة</span>
              </button>
            )}

            {/* WhatsApp */}
            <button
              onClick={shareViaWhatsApp}
              className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm font-arabic">واتساب</span>
            </button>

            {/* Telegram */}
            <button
              onClick={shareViaTelegram}
              className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-arabic">تليجرام</span>
            </button>
          </div>

          <button
            onClick={() => setShowOptions(false)}
            className="w-full text-center py-2 text-gray-600 text-sm font-arabic hover:text-gray-800 mt-3 border-t pt-3"
          >
            إغلاق
          </button>
        </div>
      )}
    </div>
  );
}