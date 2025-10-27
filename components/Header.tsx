import React from 'react';
import { GraduationCapIcon } from './icons/GraduationCapIcon';

export const Header: React.FC = () => {
  return (
    <header className="py-6 px-4 text-center bg-gradient-to-br from-indigo-900 via-blue-800 to-sky-600 shadow-lg">
      <div className="flex justify-center items-center gap-4">
        <GraduationCapIcon className="h-12 w-12 md:h-14 md:w-14 text-white" />
        <h1 className="text-4xl md:text-5xl font-bold text-white">
          Rúbric<span className="text-sky-300">@</span>s <span className="text-red-500">E</span><span className="text-blue-400">B</span><span className="text-yellow-400">P</span>
        </h1>
      </div>
      <p className="mt-2 text-indigo-200">Tu asistente inteligente para la creación de rúbricas de evaluación</p>
    </header>
  );
};