import React, { useRef, useState, useEffect } from 'react';
import type { Rubric } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';

interface RubricDisplayProps {
  rubric: Rubric;
  onRubricUpdate?: (updatedRubric: Rubric) => void;
}

const colorScale = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e']; // red, orange, yellow, lime, green

const getHeaderStyle = (index: number, total: number): React.CSSProperties => {
    // We want the highest score (which will be at index 0 after reversing) to be green
    // The color scale is from red to green, so we access it in reverse
    const colorIndex = total - 1 - index;
    const color = colorScale[colorIndex] || (index < total / 2 ? colorScale[0] : colorScale[colorScale.length - 1]);
    
    return {
        backgroundColor: color,
        color: 'white',
        textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
    };
};

export const RubricDisplay: React.FC<RubricDisplayProps> = ({ rubric, onRubricUpdate }) => {
  const rubricRef = useRef<HTMLDivElement>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedRubric, setEditedRubric] = useState<Rubric>(rubric);

  useEffect(() => {
    setEditedRubric(structuredClone(rubric));
  }, [rubric]);

  // Reverse headers and descriptors to display from highest to lowest
  const reversedHeaders = [...editedRubric.scaleHeaders].reverse();
  const rubricToDisplay = isEditMode ? editedRubric : rubric;

  const handleDownloadPreview = () => {
    const styleToString = (style: React.CSSProperties) => {
      return Object.entries(style)
        .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}:${value}`)
        .join(';');
    };
  
    const currentRubric = rubricToDisplay;
    const reversedHeaders = [...currentRubric.scaleHeaders].reverse();
  
    const tableHeader = `
      <thead>
        <tr>
          <th style="padding: 12px; font-weight: 600; text-align: left; border: 1px solid #e2e8f0; width: 25%; background-color: #f8fafc; vertical-align: top;">Ítem de Evaluación</th>
          ${reversedHeaders.map((header, index) => `
            <th style="padding: 12px; font-weight: 700; text-align: center; border: 1px solid #e2e8f0; ${styleToString(getHeaderStyle(index, reversedHeaders.length))}">
              <div style="font-size: 1rem;">${header.level.toUpperCase()}</div>
              <div style="font-size: 1.125rem;">${header.score}</div>
            </th>
          `).join('')}
        </tr>
      </thead>
    `;
  
    const tableBody = `
      <tbody>
        ${currentRubric.items.map(item => {
          const reversedDescriptors = [...item.descriptors].reverse();
          return `
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="padding: 12px; font-weight: 600; border: 1px solid #e2e8f0; vertical-align: top; background-color: #f8fafc;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <span style="flex-grow: 1;">${item.itemName}</span>
                  <span style="font-weight: 700; background-color: #e2e8f0; border-radius: 9999px; padding: 2px 8px; font-size: 0.75rem; white-space: nowrap; margin-left: 8px;">${item.weight}%</span>
                </div>
                ${(currentRubric.specificCriteria && currentRubric.specificCriteria.length > 0) ? `
                  <div style="margin-top: 8px;">
                    ${currentRubric.specificCriteria.map(criterion => {
                      const criterionNumber = criterion.match(/^[\d.]+/)?.[0] || '';
                      if (!criterionNumber) return '';
                      return `<span style="font-size: 0.75rem; font-weight: 500; background-color: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; margin-right: 6px; display: inline-block; margin-top: 4px;">${criterionNumber}</span>`;
                    }).join('')}
                  </div>
                ` : ''}
              </td>
              ${reversedDescriptors.map(descriptor => `
                <td style="padding: 12px; border: 1px solid #e2e8f0; vertical-align: top;">
                  ${descriptor.description}
                </td>
              `).join('')}
            </tr>
          `;
        }).join('')}
      </tbody>
    `;
  
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${currentRubric.title} - Vista Previa</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 14px;
            color: #334155;
            padding: 40px 20px;
            background-color: #f8fafc;
          }
          .container {
            max-width: 1400px;
            margin: 0 auto;
            background-color: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          h1 {
            text-align: center;
            font-size: 2rem;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 32px;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          .instructions {
            background-color: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
            font-size: 14px;
            color: #1e40af;
          }
          .instructions h3 {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
          }
          .instructions ul {
            margin-left: 20px;
            margin-top: 8px;
          }
          .instructions li {
            margin-bottom: 4px;
          }
          @media print {
            body {
              background-color: white;
              padding: 0;
            }
            .container {
              box-shadow: none;
              padding: 0;
            }
            .instructions {
              display: none;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @page {
              size: A4 landscape;
              margin: 1.5cm;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="instructions">
            <h3>💡 Instrucciones de uso:</h3>
            <ul>
              <li><strong>Imprimir o guardar como PDF:</strong> Pulsa Ctrl+P (Windows/Linux) o Cmd+P (Mac)</li>
              <li><strong>Copiar la tabla:</strong> Selecciona la tabla con el ratón y pulsa Ctrl+C (Windows/Linux) o Cmd+C (Mac)</li>
              <li><strong>Pegar en Google Docs/Word:</strong> Después de copiar, pega con Ctrl+V (Windows/Linux) o Cmd+V (Mac)</li>
            </ul>
          </div>
          <h1>${currentRubric.title}</h1>
          <table>
            ${tableHeader}
            ${tableBody}
          </table>
        </div>
      </body>
      </html>
    `;
  
    // Open in new window
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(htmlContent);
      previewWindow.document.close();
    } else {
      alert('Por favor, permite las ventanas emergentes para usar la vista previa.');
    }
  };
  
  return (
    <div ref={rubricRef} className="bg-white p-6 md:p-8 rounded-lg shadow-lg border border-slate-200 animate-fade-in printable-area relative">
      <div className="absolute top-4 right-4 flex items-center gap-2 no-print">
        <button 
          onClick={() => {
            if (isEditMode) {
                onRubricUpdate?.(editedRubric);
            }
            setIsEditMode(!isEditMode);
          }}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white rounded-md shadow-sm transition-colors ${
            isEditMode ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-500 hover:bg-orange-600'
          }`}
          title={isEditMode ? "Guardar cambios" : "Editar rúbrica"}
        >
          {isEditMode ? '💾 Guardar' : '✏️ Editar'}
        </button>
        <button 
          onClick={handleDownloadPreview}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
          title="Abrir en una nueva pestaña para descargar o imprimir"
        >
          <DownloadIcon />
          <span>Descargar</span>
        </button>
      </div>

      <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 text-slate-800">{rubricToDisplay.title}</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="p-3 font-semibold text-left text-sm text-slate-700 border border-slate-200 w-1/4 bg-slate-50 align-top">Ítem de Evaluación</th>
              {reversedHeaders.map((header, index) => (
                <th 
                    key={header.level} 
                    className="p-3 font-bold text-center text-sm border border-slate-200"
                    style={getHeaderStyle(index, reversedHeaders.length)}
                >
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-base">{header.level.toUpperCase()}</span>
                        <span className="text-lg">{header.score}</span>
                    </div>
                </th>
              ))}
            </tr>
          </thead>
          {isEditMode ? (
            <tbody>
              {editedRubric.items.map((item, itemIndex) => {
                const reversedDescriptors = [...item.descriptors].reverse();
                return (
                  <tr key={itemIndex} className="border-t border-slate-200">
                    <td className="p-3 font-semibold text-sm text-slate-800 border-x border-b border-slate-200 align-top bg-slate-50">
                      <textarea
                        value={item.itemName}
                        onChange={(e) => {
                          const updated = structuredClone(editedRubric);
                          updated.items[itemIndex].itemName = e.target.value;
                          setEditedRubric(updated);
                        }}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm bg-white"
                        rows={2}
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-slate-600">Peso:</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.weight}
                          onChange={(e) => {
                            const updated = structuredClone(editedRubric);
                            updated.items[itemIndex].weight = parseInt(e.target.value) || 0;
                            setEditedRubric(updated);
                          }}
                          className="w-16 px-2 py-1 border border-slate-300 rounded text-sm bg-white"
                        />
                        <span className="text-xs">%</span>
                      </div>
                    </td>
                    {reversedDescriptors.map((descriptor, descIndex) => (
                      <td key={descIndex} className="p-3 text-sm text-slate-700 border-x border-b border-slate-200 align-top">
                        <textarea
                          value={descriptor.description}
                          onChange={(e) => {
                            const updated = structuredClone(editedRubric);
                            const originalIndex = item.descriptors.length - 1 - descIndex;
                            updated.items[itemIndex].descriptors[originalIndex].description = e.target.value;
                            setEditedRubric(updated);
                          }}
                          className="w-full h-full min-h-[120px] px-2 py-1 border border-slate-300 rounded text-sm bg-white"
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          ) : (
            <tbody>
              {rubric.items.map((item, itemIndex) => {
                const reversedDescriptors = [...item.descriptors].reverse();
                return (
                  <tr key={itemIndex} className="border-t border-slate-200">
                      <td className="p-3 font-semibold text-sm text-slate-800 border-x border-b border-slate-200 align-top bg-slate-50">
                          <div className="flex justify-between items-start gap-2">
                            <span>{item.itemName}</span>
                            <span className="font-bold text-slate-600 bg-slate-200 rounded px-2 py-0.5 text-xs flex-shrink-0">{item.weight}%</span>
                          </div>
                          {rubric.specificCriteria && rubric.specificCriteria.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                  {rubric.specificCriteria.map(criterion => {
                                      const criterionNumber = criterion.match(/^[\d.]+/)?.[0] || '';
                                      if (!criterionNumber) return null;
                                      return (
                                          <span key={criterion} className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded" title={criterion}>
                                              {criterionNumber}
                                          </span>
                                      );
                                  })}
                              </div>
                          )}
                      </td>
                      {reversedDescriptors.map((descriptor, descIndex) => (
                      <td key={descIndex} className="p-3 text-sm text-slate-700 border-x border-b border-slate-200 align-top">
                          {descriptor.description}
                      </td>
                      ))}
                  </tr>
                );
              })}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
};
