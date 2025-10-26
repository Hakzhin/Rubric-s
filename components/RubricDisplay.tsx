import React, { useRef, useState } from 'react';
import type { Rubric } from '../types';
import { DocsIcon } from './icons/DocsIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface RubricDisplayProps {
  rubric: Rubric;
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

export const RubricDisplay: React.FC<RubricDisplayProps> = ({ rubric }) => {
  const rubricRef = useRef<HTMLDivElement>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  // Reverse headers and descriptors to display from highest to lowest
  const reversedHeaders = [...rubric.scaleHeaders].reverse();

  const handleCopyToClipboard = async () => {
    if (!rubricRef.current) return;

    // Clone the node to avoid manipulating the live DOM
    const contentToCopy = rubricRef.current.cloneNode(true) as HTMLElement;

    // Remove the buttons from the cloned content
    const buttons = contentToCopy.querySelector('.no-print');
    if (buttons) {
      buttons.remove();
    }
    
    const htmlContent = contentToCopy.innerHTML;

    try {
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const clipboardItem = new ClipboardItem({ 'text/html': blob });
      await navigator.clipboard.write([clipboardItem]);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2500);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2500);
    }
  };
  
  const handleDownload = () => {
    const styleToString = (style: React.CSSProperties) => {
        return Object.entries(style)
            .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}:${value}`)
            .join(';');
    };

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
            ${rubric.items.map(item => {
                const reversedDescriptors = [...item.descriptors].reverse();
                return `
                    <tr style="border-top: 1px solid #e2e8f0;">
                        <td style="padding: 12px; font-weight: 600; border: 1px solid #e2e8f0; vertical-align: top; background-color: #f8fafc;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <span style="flex-grow: 1;">${item.itemName}</span>
                                <span style="font-weight: 700; background-color: #e2e8f0; border-radius: 9999px; padding: 2px 8px; font-size: 0.75rem; white-space: nowrap; margin-left: 8px;">${item.weight}%</span>
                            </div>
                            ${(rubric.specificCriteria && rubric.specificCriteria.length > 0) ? `
                                <div style="margin-top: 8px;">
                                    ${rubric.specificCriteria.map(criterion => {
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
            <title>${rubric.title}</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    font-size: 14px;
                    color: #334155;
                }
                table {
                    border-collapse: collapse;
                    width: 100%;
                }
            </style>
        </head>
        <body>
            <h2 style="text-align: center; font-size: 1.875rem; font-weight: 700; color: #1e293b; margin-bottom: 24px;">${rubric.title}</h2>
            <table>
                ${tableHeader}
                ${tableBody}
            </table>
        </body>
        </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const sanitizedTitle = rubric.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `rubrica_${sanitizedTitle}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const getCopyButtonText = () => {
    switch (copyStatus) {
        case 'copied': return '¡Copiado!';
        case 'error': return 'Error al copiar';
        default: return 'Copiar';
    }
  };
  
  return (
    <div ref={rubricRef} className="bg-white p-6 md:p-8 rounded-lg shadow-lg border border-slate-200 animate-fade-in printable-area relative">
      <div className="absolute top-4 right-4 flex items-center gap-2 no-print">
        <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
            title="Descargar como documento editable (.doc) para Google Docs, Word, etc."
        >
            <DownloadIcon />
            <span>Descargar</span>
        </button>
        <button 
            onClick={handleCopyToClipboard}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white rounded-md shadow-sm transition-colors ${copyStatus === 'copied' ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
            title="Copiar como tabla enriquecida para pegar en Google Docs, Word, etc."
        >
            <DocsIcon />
            <span>{getCopyButtonText()}</span>
        </button>
      </div>

      <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 text-slate-800">{rubric.title}</h2>
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
        </table>
      </div>
    </div>
  );
};