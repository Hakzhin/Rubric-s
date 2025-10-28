import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { GlobeIcon } from './icons/GlobeIcon';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectLanguage = (lang: string) => {
    setLanguage(lang);
    setIsDropdownOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 rounded-md transition-colors"
        aria-haspopup="true"
        aria-expanded={isDropdownOpen}
      >
        <GlobeIcon className="h-5 w-5" />
        {language.toUpperCase()}
      </button>
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-white rounded-md shadow-lg py-1 z-50 animate-fade-in">
          <button
            onClick={() => selectLanguage('es')}
            className={`w-full text-left block px-4 py-2 text-sm ${language === 'es' ? 'font-bold text-indigo-600' : 'text-slate-700'} hover:bg-slate-100`}
          >
            {t('spanish')}
          </button>
          <button
            onClick={() => selectLanguage('en')}
            className={`w-full text-left block px-4 py-2 text-sm ${language === 'en' ? 'font-bold text-indigo-600' : 'text-slate-700'} hover:bg-slate-100`}
          >
            {t('english')}
          </button>
          <button
            onClick={() => selectLanguage('fr')}
            className={`w-full text-left block px-4 py-2 text-sm ${language === 'fr' ? 'font-bold text-indigo-600' : 'text-slate-700'} hover:bg-slate-100`}
          >
            {t('french')}
          </button>
        </div>
      )}
    </div>
  );
};