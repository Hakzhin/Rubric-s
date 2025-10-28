import React from 'react';
import { GraduationCapIcon } from './icons/GraduationCapIcon';
import { LanguageSelector } from './LanguageSelector';
import { useLanguage } from '../hooks/useLanguage';

export const Header: React.FC = () => {
  const { t } = useLanguage();
  return (
    <header className="relative py-6 px-4 text-center bg-gradient-to-br from-indigo-900 via-blue-800 to-sky-600 shadow-lg">
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10">
        <LanguageSelector />
      </div>
      <div className="flex justify-center items-center gap-4">
        <GraduationCapIcon className="h-12 w-12 md:h-14 md:w-14 text-white" />
        <h1 className="text-4xl md:text-5xl font-bold text-white">
          Rubric<span className="text-sky-300">@</span>s <span className="text-red-500">E</span><span className="text-blue-400">B</span><span className="text-yellow-400">P</span>
        </h1>
      </div>
      <p className="mt-2 text-indigo-200">{t('header_subtitle')}</p>
    </header>
  );
};
