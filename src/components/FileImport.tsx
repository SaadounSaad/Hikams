import React, { useRef, useState } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import { parseTextFile, parseExcelFile } from '../utils/fileParser';
import { storage } from '../utils/storage';

interface FileImportProps {
  onImport: () => void;
}

export const FileImport: React.FC<FileImportProps> = ({ onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      setIsImporting(true);

      const extension = file.name.toLowerCase().split('.').pop();
      if (!extension || !['txt', 'xlsx', 'xls'].includes(extension)) {
        throw new Error('Format de fichier non supporté. Utilisez .txt, .xlsx ou .xls');
      }

      if (file.size > 1024 * 1024) {
        throw new Error('Le fichier est trop volumineux. Taille maximum : 1MB');
      }

      const quotes = extension === 'txt' 
        ? await parseTextFile(file)
        : await parseExcelFile(file);
      
      let importedCount = 0;
      for (const quote of quotes) {
        try {
          await storage.saveQuote(quote);
          importedCount++;
        } catch (error) {
          console.error('Erreur lors de l\'importation d\'une citation:', error);
        }
      }
      
      onImport();
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      if (importedCount === 0) {
        throw new Error('Aucune citation n\'a pu être importée. Vérifiez le format du fichier.');
      } else if (importedCount < quotes.length) {
        setError(`${importedCount} citation(s) importée(s) sur ${quotes.length}. Certaines citations n'ont pas pu être importées.`);
      } else {
        alert(`${importedCount} citation(s) importée(s) avec succès.`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'importation du fichier';
      console.error('Erreur lors de l\'importation:', errorMessage);
      setError(errorMessage);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.xlsx,.xls"
        onChange={handleImport}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isImporting}
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-600/10 text-gray-700 rounded-xl hover:bg-gray-600/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Importer depuis un fichier texte ou Excel"
      >
        <Upload className="w-5 h-5" />
        <span className="text-sm font-medium">
          {isImporting ? 'Importation...' : 'Importer'}
        </span>
      </button>
      
      {error && (
        <div className="absolute top-full left-0 mt-2 p-4 bg-red-50 border border-red-100 rounded-xl shadow-sm w-64 z-50">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-grow">
              <h3 className="text-sm font-medium text-red-800 mb-1">Erreur d'importation</h3>
              <div className="text-sm text-red-700 whitespace-pre-line">{error}</div>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-600 hover:text-red-800 p-1 hover:bg-red-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};