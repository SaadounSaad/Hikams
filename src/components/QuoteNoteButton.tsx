// src/components/QuoteNoteButton.tsx
import React, { useState, useEffect } from 'react';
import { StickyNote, ChevronDown, ChevronUp } from 'lucide-react';
import { storage } from '../utils/storage';
import QuoteNoteEditor from './QuoteNoteEditor';

interface QuoteNoteButtonProps {
  quoteId: string;
}

export const QuoteNoteButton: React.FC<QuoteNoteButtonProps> = ({ quoteId }) => {
  const [showNotes, setShowNotes] = useState(false);
  const [notesCount, setNotesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Charger le nombre de notes au chargement du composant
  useEffect(() => {
    const loadNotesCount = async () => {
      try {
        setIsLoading(true);
        const notes = await storage.getQuoteNotes(quoteId);
        setNotesCount(notes.length);
      } catch (error) {
        console.error('Erreur lors du chargement des notes :', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotesCount();
  }, [quoteId]);

  const handleNotesUpdated = (count: number) => {
    setNotesCount(count);
  };

  return (
    <div className="notes-section mt-4">
      <button 
        onClick={() => setShowNotes(!showNotes)}
        className="flex items-center justify-between w-full text-sm font-medium px-4 py-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
        disabled={isLoading}
      >
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4" />
          <span>Mes notes {notesCount > 0 ? `(${notesCount})` : ''}</span>
        </div>
        {isLoading ? (
          <span className="animate-pulse">...</span>
        ) : (
          showNotes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
        )}
      </button>
      
      {showNotes && (
        <div className="mt-3 animate-slide-down">
          <QuoteNoteEditor 
            quoteId={quoteId} 
            onNotesUpdated={handleNotesUpdated}
          />
        </div>
      )}
    </div>
  );
};

export default QuoteNoteButton;