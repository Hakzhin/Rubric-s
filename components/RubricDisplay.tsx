import React from 'react';
import type { Rubric } from '../types';

interface RubricDisplayProps {
  rubric: Rubric;
}

export const RubricDisplay: React.FC<RubricDisplayProps> = ({ rubric }) => {
  // Función para determinar el color según el nivel
  const getColorForLevel = (level: string): string => {
    const levelLower = level.toLowerCase();
    if (levelLower.includes('sobresaliente') || levelLower.includes('9-10') || levelLower.includes('9') || levelLower.includes('10')) {
      return 'bg-lime-500 text-white'; // Verde lima más oscuro
    } else if (levelLower.includes('notable') || levelLower.includes('7-8') || levelLower.includes('7') || levelLower.includes('8')) {
      return 'bg-green-400 text-white'; // Verde claro
    } else if (levelLower.includes('bien') || levelLower.includes('6')) {
      return 'bg-yellow-400 text-gray-900'; // Amarillo/dorado
    } else if (levelLower.includes('suficiente') || levelLower.includes('5')) {
      return 'bg-orange-500 text-white'; // Naranja
    } else if (levelLower.includes('insuficiente') || levelLower.includes('0-4') || levelLower.includes('0') || levelLower.includes('1') || levelLower.includes('2') || levelLower.includes('3') || levelLower.includes('4')) {
      return 'bg-red-500 text-white'; // Rojo
    }
    return 'bg-slate-100 text-slate-700'; // Color por defecto
  };

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
            <tr>
              <th className="border border-slate-300 px-4 py-3 text-left font-semibold text-slate-700 bg-slate-100">
                Ítem de Evaluación
              </th>
              {rubric.scaleHeaders.map((header, index) => (
                <th
                  key={index}
                  className={`border border-slate-300 px-4 py-3 text-center font-semibold ${getColorForLevel(header.level)}`}
                >
                  <div className="font-bold uppercase text-sm">{header.level}</div>
                  <div className="text-base font-bold mt-1">{header.score}</div>
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
                    {item.weight}%
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
      <div className="p-4 bg-slate-100 text-center text-sm text-slate-600 no-print">
        <p>Rúbrica generada con IA • Basada en la LOMLOE</p>
      </div>
    </div>
  );
};
