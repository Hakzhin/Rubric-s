import React, { createContext, useState, ReactNode, useCallback } from 'react';
import { translations, TranslationKey } from '../translations';

type Language = 'es' | 'en' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: string) => void;
  t: (key: TranslationKey) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('es');

  const t = useCallback((key: TranslationKey): string => {
    return translations[language][key] || translations['es'][key] || key;
  }, [language]);

  const value = {
    language,
    setLanguage: (lang: string) => setLanguage(lang as Language),
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};