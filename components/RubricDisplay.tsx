import React, { useRef, useState, useEffect } from 'react';
import type { Rubric } from '../types';
import { PrintIcon } from './icons/PrintIcon';
import { ExcelIcon } from './icons/ExcelIcon';
import { useLanguage } from '../hooks/useLanguage';

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
  const { t } = useLanguage();
  const rubricRef = useRef<HTMLDivElement>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedRubric, setEditedRubric] = useState<Rubric>(rubric);

  useEffect(() => {
    setEditedRubric(structuredClone(rubric));
  }, [rubric]);

  // Reverse headers and descriptors to display from highest to lowest
  const reversedHeaders = [...editedRubric.scaleHeaders].reverse();
  const rubricToDisplay = isEditMode ? editedRubric : rubric;

  const handleHeaderScoreChange = (levelToUpdate: string, newScore: string) => {
    const updatedRubric = structuredClone(editedRubric);

    // Find and update the header
    const headerToUpdate = updatedRubric.scaleHeaders.find(h => h.level === levelToUpdate);
    if (headerToUpdate) {
        headerToUpdate.score = newScore;
    }

    // Find and update all corresponding descriptors
    updatedRubric.items.forEach(item => {
        item.descriptors.forEach(desc => {
            if (desc.level === levelToUpdate) {
                desc.score = newScore;
            }
        });
    });

    setEditedRubric(updatedRubric);
  };

  const handleExportToExcel = () => {
    const XLSX = (window as any).XLSX;
    if (typeof XLSX === 'undefined') {
        console.error('XLSX library is not loaded.');
        alert('Error: La librería de exportación a Excel no está disponible.');
        return;
    }

    const currentRubric = isEditMode ? editedRubric : rubric;
    const reversedHeaders = [...currentRubric.scaleHeaders].reverse();
    const headerCount = reversedHeaders.length;

    // --- Color and Style Definitions from Image ---
    const levelStyles: { [key: string]: { fill: string; font: string } } = {
        'SOBRESALIENTE': { fill: '70AD47', font: 'FFFFFF' },
        'NOTABLE':       { fill: 'A9D08E', font: '000000' },
        'BIEN':          { fill: 'FFC000', font: '000000' },
        'SUFICIENTE':    { fill: 'ED7D31', font: 'FFFFFF' },
        'INSUFICIENTE':  { fill: 'FF0000', font: 'FFFFFF' },
    };
    const BORDER_STYLE = { style: "thin" as const, color: { rgb: "BFBFBF" } };
    const ALL_BORDERS = { top: BORDER_STYLE, bottom: BORDER_STYLE, left: BORDER_STYLE, right: BORDER_STYLE };

    // --- Data Preparation ---
    const titleRow = [`Rúbrica de Evaluación: ${currentRubric.title}`, ...Array(headerCount).fill(null)];
    const headerRow = [`Ítem de Evaluación (% Ponderación)`, ...reversedHeaders.map(h => `${h.level.toUpperCase()}\n(${h.score})`)];
    const sheetData = [titleRow, headerRow];

    currentRubric.items.forEach(item => {
        const criteriaNumbers = currentRubric.specificCriteria
            .map(c => c.match(/^[\d.]+/)?.[0])
            .filter(Boolean)
            .join(' ');

        const firstColText = `${item.itemName} (${item.weight}%)` + (criteriaNumbers ? `\n\n${criteriaNumbers}` : '');

        const row = [firstColText];
        const reversedDescriptors = [...item.descriptors].reverse();
        reversedDescriptors.forEach(desc => {
            row.push(desc.description);
        });
        sheetData.push(row);
    });

    // --- Worksheet Creation ---
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    
    // --- Style Application ---
    const range = XLSX.utils.decode_range(ws['!ref']!);

    // Title Style (Row 0)
    const titleCellRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
    if(ws[titleCellRef]) {
        ws[titleCellRef].s = {
            font: { sz: 12, bold: true, name: 'Calibri' },
            alignment: { vertical: 'center' as const, horizontal: 'left' as const, indent: 1 },
            fill: { fgColor: { rgb: "E9EAEC" }, patternType: 'solid' as const }
        };
    }
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: headerCount } });

    // Header Styles (Row 1)
    const itemHeaderCellRef = XLSX.utils.encode_cell({ r: 1, c: 0 });
     if(ws[itemHeaderCellRef]) {
        ws[itemHeaderCellRef].s = {
            font: { sz: 11, bold: true, color: { rgb: "000000" }, name: 'Calibri' },
            fill: { fgColor: { rgb: "BFBFBF" }, patternType: 'solid' as const },
            alignment: { horizontal: 'center' as const, vertical: 'center' as const, wrapText: true },
            border: ALL_BORDERS
        };
    }

    for (let C = 1; C <= headerCount; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: 1, c: C });
        const headerText = reversedHeaders[C-1].level.toUpperCase().trim();
        const style = levelStyles[headerText] || { fill: 'D9D9D9', font: '000000' };
        if(ws[cellRef]) {
            ws[cellRef].s = {
                font: { sz: 12, bold: true, color: { rgb: style.font }, name: 'Calibri' },
                fill: { fgColor: { rgb: style.fill }, patternType: 'solid' as const },
                alignment: { horizontal: 'center' as const, vertical: 'center' as const, wrapText: true },
                border: ALL_BORDERS
            };
        }
    }

    // Data Row Styles (Row 2 onwards)
    for (let R = 2; R <= range.e.r; ++R) {
        const firstColCellRef = XLSX.utils.encode_cell({ r: R, c: 0 });
        if(ws[firstColCellRef]) {
            ws[firstColCellRef].s = {
                font: { sz: 11, bold: true, name: 'Calibri', color: { rgb: "000000" } },
                fill: { fgColor: { rgb: "F2F2F2" }, patternType: 'solid' as const },
                alignment: { vertical: 'top' as const, horizontal: 'left' as const, wrapText: true },
                border: ALL_BORDERS
            };
        }
        for (let C = 1; C <= headerCount; ++C) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
            if (ws[cellRef]) {
              ws[cellRef].s = {
                  font: { sz: 11, name: 'Calibri' },
                  alignment: { vertical: 'top' as const, horizontal: 'left' as const, wrapText: true },
                  border: ALL_BORDERS,
                  fill: { fgColor: { rgb: "DDEBF7" }, patternType: 'solid' as const }
              };
            }
        }
    }
    
    // --- Dimensions ---
    ws['!cols'] = [
      { wch: 35 }, 
      ...Array(headerCount).fill({ wch: 45 })
    ];
    ws['!rows'] = [
        { hpx: 25 }, 
        { hpx: 60 }, 
        ...currentRubric.items.map(() => ({ hpx: 150 }))
    ];

    // --- Workbook Creation & Download ---
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rúbrica');
    const fileName = `${currentRubric.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

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
          <th style="padding: 12px; font-weight: 600; text-align: left; border: 1px solid #e2e8f0; width: 25%; background-color: #f8fafc; vertical-align: top;">${t('evaluation_item')}</th>
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
    <div ref={rubricRef} className="bg-slate-100 p-6 md:p-8 rounded-lg shadow-lg border border-slate-200 animate-fade-in printable-area">
      <div className="flex justify-end items-center gap-2 mb-4 no-print">
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
          title={isEditMode ? t('save_changes') : t('edit_rubric')}
        >
          {isEditMode ? `💾 ${t('save')}` : `✏️ ${t('edit')}`}
        </button>
        <button 
          onClick={handleExportToExcel}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-green-700 hover:bg-green-800 rounded-md shadow-sm transition-colors"
          title={t('export_to_excel')}
        >
          <ExcelIcon />
          <span>{t('excel')}</span>
        </button>
        <button 
          onClick={handleDownloadPreview}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
          title={t('print_or_pdf_title')}
        >
          <PrintIcon />
          <span>{t('print_pdf')}</span>
        </button>
      </div>

      <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 text-slate-800">{rubricToDisplay.title}</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse bg-white">
          <thead>
            <tr>
              <th className="p-3 font-semibold text-left text-sm text-slate-700 border border-slate-200 w-1/4 bg-slate-50 align-top">{t('evaluation_item')}</th>
              {reversedHeaders.map((header, index) => (
                <th 
                    key={header.level} 
                    className="p-3 font-bold text-center text-sm border border-slate-200"
                    style={getHeaderStyle(index, reversedHeaders.length)}
                >
                    <div className="flex flex-col items-center justify-center gap-1">
                        <span className="text-base">{header.level.toUpperCase()}</span>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={header.score}
                            onChange={(e) => handleHeaderScoreChange(header.level, e.target.value)}
                            className="w-24 p-1 text-center bg-white text-slate-900 border border-slate-400 rounded-md shadow-inner text-lg"
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                          />
                        ) : (
                          <span className="text-lg">{header.score}</span>
                        )}
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
                        <span className="text-xs text-slate-600">{t('weight')}:</span>
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