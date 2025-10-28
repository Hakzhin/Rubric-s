

import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { RubricForm } from './components/RubricForm';
import { RubricDisplay } from './components/RubricDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { SavedRubrics } from './components/SavedRubrics';
import { generateRubric } from './services/geminiService';
import { saveRubricToStorage, type SavedRubric } from './utils/rubricStorage';
import type { Rubric, FormData } from './types';
import { useLanguage } from './hooks/useLanguage';
import type { TranslationKey } from './translations';

const App: React.FC = () => {
  const { t } = useLanguage();
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFormData, setCurrentFormData] = useState<FormData | null>(null);
  const [loadedFormData, setLoadedFormData] = useState<FormData | null>(null);
  const [rubricSaveCounter, setRubricSaveCounter] = useState(0);

  const handleFormSubmit = useCallback(async (formData: FormData) => {
    setIsLoading(true);
    setError(null);
    setRubric(null);
    setCurrentFormData(formData);
    try {
      const result = await generateRubric(formData);
      setRubric(result);
      saveRubricToStorage(result, formData);
      setRubricSaveCounter(c => c + 1);
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        const key = err.message as TranslationKey;
        const translatedError = t(key);
        // Fallback if the key doesn't exist
        setError(translatedError === key ? t('error_generating_rubric') : translatedError);
      } else {
        setError(t('error_generating_rubric'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [t]);
  
  const handleLoadRubric = (saved: SavedRubric) => {
      setRubric(saved.rubric);
      setCurrentFormData(saved.formData);
      setLoadedFormData(saved.formData);
      // Scroll to the form
      const formElement = document.getElementById('rubric-form');
      formElement?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleRubricUpdate = (updatedRubric: Rubric) => {
    setRubric(updatedRubric);
    if(currentFormData) {
        saveRubricToStorage(updatedRubric, currentFormData);
        setRubricSaveCounter(c => c + 1);
    }
  }

  const handleFormReset = useCallback(() => {
    setRubric(null);
    setError(null);
    setLoadedFormData(null);
    setCurrentFormData(null);
  }, []);

  return (
    <div className="min-h-screen">
      <div className="no-print">
        <Header />
      </div>
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="no-print">
            <SavedRubrics onLoadRubric={handleLoadRubric} key={rubricSaveCounter} />
            <div id="rubric-form">
              <RubricForm 
                onSubmit={handleFormSubmit} 
                isLoading={isLoading} 
                initialData={loadedFormData}
                onReset={handleFormReset}
              />
            </div>
          </div>
          <div className="mt-8">
            {isLoading && (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-100 rounded-lg shadow-md border border-slate-200 no-print">
                <LoadingSpinner />
                <p className="mt-4 text-slate-600">{t('generating_rubric_please_wait')}</p>
              </div>
            )}
            {error && (
              <div className="p-4 text-center text-red-700 bg-red-100 border border-red-400 rounded-lg no-print">
                {error}
              </div>
            )}
            {rubric && !isLoading && <RubricDisplay rubric={rubric} onRubricUpdate={handleRubricUpdate} />}
             {!rubric && !isLoading && !error && (
              <div className="text-center p-8 bg-slate-100 rounded-lg shadow-md border border-slate-200 no-print">
                <h2 className="text-xl font-semibold text-slate-700">{t('start_designing_rubric')}</h2>
                <p className="mt-2 text-slate-500">{t('complete_form_for_rubric')}</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <footer className="text-center p-4 text-slate-400 text-sm no-print">
        <p>{t('developed_by')}</p>
      </footer>
    </div>
  );
};

export default App;