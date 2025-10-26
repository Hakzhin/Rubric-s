
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { RubricForm } from './components/RubricForm';
import { RubricDisplay } from './components/RubricDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { generateRubric } from './services/geminiService';
import type { Rubric, FormData } from './types';

const App: React.FC = () => {
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = useCallback(async (formData: FormData) => {
    setIsLoading(true);
    setError(null);
    setRubric(null);
    try {
      const result = await generateRubric(formData);
      setRubric(result);
    } catch (err) {
      console.error(err);
      // Reverted: Check for Vite-specific API key related errors.
      if (err instanceof Error && err.message.includes('VITE_GEMINI_API_KEY')) {
        setError(err.message);
      } else {
        setError('Hubo un error al generar la rúbrica. Por favor, inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen">
      <div className="no-print">
        <Header />
      </div>
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="no-print">
            <RubricForm onSubmit={handleFormSubmit} isLoading={isLoading} />
          </div>
          <div className="mt-8">
            {isLoading && (
              <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md border border-slate-200 no-print">
                <LoadingSpinner />
                <p className="mt-4 text-slate-600">Generando rúbrica, por favor espera...</p>
              </div>
            )}
            {error && (
              <div className="p-4 text-center text-red-700 bg-red-100 border border-red-400 rounded-lg no-print">
                {error}
              </div>
            )}
            {rubric && !isLoading && <RubricDisplay rubric={rubric} />}
             {!rubric && !isLoading && !error && (
              <div className="text-center p-8 bg-white rounded-lg shadow-md border border-slate-200 no-print">
                <h2 className="text-xl font-semibold text-slate-700">Comienza a diseñar tu rúbrica</h2>
                <p className="mt-2 text-slate-500">Completa el formulario de arriba para generar una rúbrica de evaluación personalizada con IA.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <footer className="text-center p-4 text-slate-400 text-sm no-print">
        <p>Desarrollado con IA por Rúbric@s EBP</p>
      </footer>
    </div>
  );
};

export default App;