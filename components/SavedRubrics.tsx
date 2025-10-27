import React, { useState, useEffect } from 'react';
import { getSavedRubrics, deleteRubric, type SavedRubric } from '../utils/rubricStorage';

interface SavedRubricsProps {
  onLoadRubric: (saved: SavedRubric) => void;
}

export const SavedRubrics: React.FC<SavedRubricsProps> = ({ onLoadRubric }) => {
  const [savedRubrics, setSavedRubrics] = useState<SavedRubric[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setSavedRubrics(getSavedRubrics());
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Eliminar esta rúbrica guardada?')) {
      deleteRubric(id);
      setSavedRubrics(getSavedRubrics());
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Re-check on open to catch rubrics saved in other tabs.
  const toggleOpen = () => {
    if (!isOpen) {
        setSavedRubrics(getSavedRubrics());
    }
    setIsOpen(!isOpen);
  }

  if (getSavedRubrics().length === 0 && savedRubrics.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 no-print">
      <button
        onClick={toggleOpen}
        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-md transition-colors w-full md:w-auto justify-center"
      >
        📚 Rúbricas guardadas ({savedRubrics.length})
        <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="mt-4 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden animate-fade-in">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-semibold text-slate-700">Últimas 10 rúbricas guardadas</h3>
          </div>
          <div className="divide-y divide-slate-200">
            {savedRubrics.length > 0 ? savedRubrics.map((saved) => (
              <div
                key={saved.id}
                onClick={() => {
                  onLoadRubric(saved);
                  setIsOpen(false);
                }}
                className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex justify-between items-start"
              >
                <div className="flex-grow">
                  <h4 className="font-semibold text-slate-800">{saved.title}</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    {saved.formData.stage} - {saved.formData.course} - {saved.formData.subject}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Guardado: {formatDate(saved.createdAt)}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(saved.id, e)}
                  className="ml-4 p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors flex-shrink-0"
                  title="Eliminar"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                </button>
              </div>
            )) : (
                <p className="p-4 text-slate-500">No hay rúbricas guardadas.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
