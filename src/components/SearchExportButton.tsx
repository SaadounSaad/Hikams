// ===========================================
// 3. Composant d'export avec interface
// ===========================================

// src/components/SearchExportButton.tsx
import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, FileJson, FileX } from 'lucide-react';
import { SearchExporter, ExportOptions } from '../utils/searchExport';
import { Quote } from '../types';

interface SearchExportButtonProps {
  results: Quote[];
  searchQuery: string;
  className?: string;
}

export function SearchExportButton({ results, searchQuery, className = "" }: SearchExportButtonProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: ExportOptions['format']) => {
    setIsExporting(true);
    setShowOptions(false);
    
    try {
      await SearchExporter.exportResults(results, searchQuery, {
        format,
        includeMetadata: true,
        groupByCategory: false
      });
    } catch (error) {
      console.error('Erreur export:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (results.length === 0) return null;

  const exportFormats = [
    { format: 'txt' as const, icon: FileText, label: 'نص عادي', desc: 'ملف نصي بسيط' },
    { format: 'csv' as const, icon: FileSpreadsheet, label: 'جدول بيانات', desc: 'Excel/Sheets' },
    { format: 'json' as const, icon: FileJson, label: 'JSON', desc: 'للمطورين' },
    { format: 'pdf' as const, icon: FileX, label: 'PDF', desc: 'ملف PDF' }
  ];

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={isExporting}
        className={`
          flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg 
          hover:bg-green-700 transition-colors disabled:opacity-50
        `}
      >
        <Download className="w-4 h-4" />
        <span className="font-arabic">
          {isExporting ? 'جاري التصدير...' : 'تصدير النتائج'}
        </span>
        <span className="text-green-200 text-sm">({results.length})</span>
      </button>

      {showOptions && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-50 min-w-64">
          <h3 className="text-sm font-medium text-gray-900 mb-3 font-arabic">
            اختر تنسيق التصدير
          </h3>
          
          <div className="space-y-2">
            {exportFormats.map(({ format, icon: Icon, label, desc }) => (
              <button
                key={format}
                onClick={() => handleExport(format)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-right"
              >
                <Icon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <div className="flex-1 text-right">
                  <div className="font-medium text-gray-900 font-arabic">{label}</div>
                  <div className="text-xs text-gray-500 font-arabic">{desc}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200">
            <button
              onClick={() => setShowOptions(false)}
              className="w-full text-center py-2 text-gray-600 text-sm font-arabic hover:text-gray-800"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
