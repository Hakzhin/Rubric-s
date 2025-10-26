import React from 'react';
import type { Rubric } from '../types';

interface RubricDisplayProps {
  rubric: Rubric;
}

export const RubricDisplay: React.FC<RubricDisplayProps> = ({ rubric }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    let text = `${rubric.title}\n\n`;
    
    rubric.items.forEach(item => {
      text += `${item.itemName} (${item.weight}%)\n`;
      item.descriptors.forEach(desc => {
        text += `  ${desc.level} (${desc.score} pts): ${desc.description}\n`;
      });
      text += '\n';
    });

    if (rubric.specificCriteria && rubric.specificCriteria.length > 0) {
      text += '\nCriterios Específicos:\n';
      rubric.specificCriteria.forEach(criterion => {
        text += `- ${criterion}\n`;
      });
    }

    navigator.clipboard.writeText(text).then(() => {
      alert('Rúbrica copiada al portapapeles');
    }).catch(() => {
      alert('Error al copiar. Intenta seleccionar el texto manualmente.');
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
      {/* Header con título y botones */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
        <h2 className="text-2xl font-bold mb-4">{rubric.title}</h2>
        <div className="flex flex-wrap gap-3 mt-4 no-print">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-lg hover:bg-blue-50 font-semibold transition-all shadow-md hover:shadow-lg text-base"
          >
            <span className="text-xl">🖨️</span>
            <span>Imprimir</span>
          </button>
          <button
            onClick={handleCopyText}
            className="flex items-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-lg hover:bg-blue-50 font-semibold transition-all shadow-md hover:shadow-lg text-base"
          >
            <span className="text-xl">📋</span>
            <span>Copiar Texto</span>
          </button>
        </div>
      </div>

      {/* Tabla de rúbrica */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 px-4 py-3 text-left font-semibold text-slate-700">
                Criterio / Ponderación
              </th>
              {rubric.scaleHeaders.map((header, index) => (
                <th
                  key={index}
                  className="border border-slate-300 px-4 py-3 text-center font-semibold text-slate-700"
                >
                  <div>{header.level}</div>
                  <div className="text-sm font-normal text-slate-600">({header.score} pts)</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rubric.items.map((item, itemIndex) => (
              <tr key={itemIndex} className="hover:bg-slate-50">
                <td className="border border-slate-300 px-4 py-3 font-semibold text-slate-800 bg-slate-50">
                  <div>{item.itemName}</div>
                  <div className="text-sm text-slate-600 font-normal mt-1">
                    Ponderación: {item.weight}%
                  </div>
                </td>
                {item.descriptors.map((descriptor, descIndex) => (
                  <td
                    key={descIndex}
                    className="border border-slate-300 px-4 py-3 text-sm text-slate-700 align-top"
                  >
                    {descriptor.description}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Criterios específicos */}
      {rubric.specificCriteria && rubric.specificCriteria.length > 0 && (
        <div className="p-6 bg-slate-50 border-t border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">Criterios Específicos</h3>
          <ul className="space-y-2">
            {rubric.specificCriteria.map((criterion, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span className="text-slate-700">{criterion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 bg-slate-100 text-center text-sm text-slate-600">
        <p>Rúbrica generada con IA • Basada en la LOMLOE</p>
      </div>
    </div>
  );
};
