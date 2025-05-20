// src/components/QuoteNoteEditor.tsx
import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus } from 'lucide-react';
import { storage, QuoteNote } from '../utils/storage';

interface QuoteNoteEditorProps {
  quoteId: string;
  onNotesUpdated?: (notesCount: number) => void;
}

export const QuoteNoteEditor: React.FC<QuoteNoteEditorProps> = ({ quoteId, onNotesUpdated }) => {
  const [notes, setNotes] = useState<QuoteNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [category, setCategory] = useState<'réflexion' | 'action' | 'objectif'>('réflexion');
  const [reminderDate, setReminderDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les notes au chargement du composant
  useEffect(() => {
    const loadNotes = async () => {
      try {
        setIsLoading(true);
        const data = await storage.getQuoteNotes(quoteId);
        setNotes(data);
        
        // Notification du nombre de notes
        if (onNotesUpdated) {
          onNotesUpdated(data.length);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des notes :', err);
        setError('Impossible de charger les notes.');
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();
  }, [quoteId, onNotesUpdated]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !newNote.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const newNoteData = await storage.saveQuoteNote({
        quote_id: quoteId,
        content: newNote.trim(),
        category,
        reminder_date: category === 'action' && reminderDate ? reminderDate : undefined,
        completed: false,
      });

      const updatedNotes = [newNoteData, ...notes];
      setNotes(updatedNotes);
      setNewNote('');
      setCategory('réflexion');
      setReminderDate('');
      
      if (onNotesUpdated) {
        onNotesUpdated(updatedNotes.length);
      }
    } catch (err) {
      console.error('Erreur lors de l\'ajout de la note :', err);
      setError('Impossible d\'ajouter la note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleComplete = async (noteId: string, currentStatus: boolean) => {
    try {
      await storage.updateQuoteNote(noteId, {
        completed: !currentStatus,
      });

      setNotes(prev => 
        prev.map(note => note.id === noteId ? { ...note, completed: !currentStatus } : note)
      );
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la note :', err);
      setError('Impossible de mettre à jour la note.');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await storage.deleteQuoteNote(noteId);
      const updatedNotes = notes.filter(note => note.id !== noteId);
      setNotes(updatedNotes);
      
      if (onNotesUpdated) {
        onNotesUpdated(updatedNotes.length);
      }
    } catch (err) {
      console.error('Erreur lors de la suppression de la note :', err);
      setError('Impossible de supprimer la note.');
    }
  };

  return (
    <div className="notes-editor">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleAddNote} className="mb-4">
        <div className="mb-3">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Ajoutez une note personnelle..."
            rows={3}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            required
          />
        </div>
        
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as 'réflexion' | 'action' | 'objectif')}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            >
              <option value="réflexion">Réflexion</option>
              <option value="action">Action</option>
              <option value="objectif">Objectif</option>
            </select>
          </div>
          
          {category === 'action' && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rappel
              </label>
              <input
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
          )}
          
          <button
            type="submit"
            disabled={isSubmitting || !newNote.trim()}
            className="px-4 py-2 font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
      </form>
      
      {isLoading ? (
        <div className="py-4 text-center text-gray-500">Chargement des notes...</div>
      ) : notes.length === 0 ? (
        <div className="py-4 text-center text-gray-500">Aucune note pour le moment</div>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <div 
              key={note.id} 
              className={`p-4 rounded-xl ${
                note.category === 'réflexion' ? 'bg-blue-50 border-l-4 border-blue-400' :
                note.category === 'action' ? 'bg-amber-50 border-l-4 border-amber-400' :
                // Suite du QuoteNoteEditor.tsx
                note.category === 'objectif' ? 'bg-green-50 border-l-4 border-green-400' :
                'bg-gray-50 border-l-4 border-gray-400'
              } ${note.completed ? 'opacity-70' : ''}`}
            >
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-white/50 text-gray-700">
                  {note.category}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(note.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <p className="mt-2 text-gray-800 whitespace-pre-line">{note.content}</p>
              
              {note.reminder_date && (
                <div className="mt-2 text-xs text-gray-500 bg-white/70 inline-block px-2 py-1 rounded-full">
                  Rappel: {new Date(note.reminder_date).toLocaleDateString()}
                </div>
              )}
              
              <div className="mt-3 flex justify-end gap-2">
                {note.category === 'action' && (
                  <button
                    onClick={() => handleToggleComplete(note.id, note.completed)}
                    className={`text-xs px-3 py-1 rounded-full ${
                      note.completed 
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {note.completed ? 'Rétablir' : 'Terminé'}
                  </button>
                )}
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="text-xs px-3 py-1 rounded-full bg-red-50 text-red-600 hover:bg-red-100"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuoteNoteEditor;