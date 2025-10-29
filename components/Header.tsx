import React from 'react';
import { GraduationCapIcon } from './icons/GraduationCapIcon';
import { useLanguage } from '../hooks/useLanguage';

export const Header: React.FC = () => {
  const { t } = useLanguage();
  return (
    <header className="relative py-6 px-4 text-center bg-gradient-to-br from-indigo-900 via-blue-800 to-sky-600 shadow-lg">
      <div className="flex justify-center items-center gap-4">
        <GraduationCapIcon className="h-20 w-20 md:h-24 md:w-24 text-white" />
        <h1 className="font-bold text-white flex items-baseline gap-2">
          <span className="text-5xl md:text-6xl">
            Rubric<span className="text-sky-300">@</span>s
          </span>
          <span className="text-4xl md:text-5xl">
            <span className="text-red-500">E</span>
            <span className="text-blue-400">B</span>
            <span className="inline-flex items-start">
              <span className="text-yellow-400">P</span>
              <sup className="text-white text-xl font-semibold ml-1 leading-none">beta</sup>
            </span>
          </span>
        </h1>
      </div>
      <p className="mt-2 text-indigo-200">{t('header_subtitle')}</p>
    </header>
  );
};
