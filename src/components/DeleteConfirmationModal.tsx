// DeleteConfirmationModal.tsx
import React from 'react';

interface DeleteConfirmationModalProps {
  quoteId: string;
  isDeleteAll: boolean;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
  onCancel: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  quoteId,
  isDeleteAll,
  onDelete,
  onDeleteAll,
  onCancel
}) => {
  return (
    <div className="fixed inset-0 bg-gray-500/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
        <h2 className="text-lg font-medium mb-4">Confirmer la suppression</h2>
        <p className="text-gray-500 mb-6">
          {isDeleteAll 
            ? "Êtes-vous sûr de vouloir supprimer toutes les citations ? Cette action est irréversible."
            : "Êtes-vous sûr de vouloir supprimer cette citation ?"}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-arabic text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              if (isDeleteAll) {
                onDeleteAll();
              } else {
                onDelete(quoteId);
              }
            }}
            className="px-4 py-2 text-sm font-arabic text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
          >
            {isDeleteAll ? 'Supprimer tout' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
};
