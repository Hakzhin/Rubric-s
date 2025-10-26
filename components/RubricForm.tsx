
import React, { useState, useEffect } from 'react';
import { ETAPAS_EDUCATIVAS, CURSOS_POR_ETAPA, ASIGNATURAS_POR_ETAPA } from '../constants';
import { generateCriteriaSuggestions } from '../services/geminiService';
import type { FormData, WeightedCriterion } from '../types';
import { MagicWandIcon } from './icons/MagicWandIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface RubricFormProps {
  onSubmit: (formData: FormData) => void;
  isLoading: boolean;
}

// Subcomponente para la sección de criterios curriculares (sin ponderación)
interface CriteriaSectionProps {
    title: string;
    criteria: string[];
    onCriteriaChange: (newCriteria: string[]) => void;
    onSuggest: () => Promise<string[]>;
    placeholder: string;
    disabled: boolean;
}

const CriteriaSection: React.FC<CriteriaSectionProps> = ({ title, criteria, onCriteriaChange, onSuggest, placeholder, disabled }) => {
    const [newItem, setNewItem] = useState('');
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAddItem = () => {
        if (newItem.trim() && !criteria.find(c => c.toLowerCase() === newItem.trim().toLowerCase())) {
            onCriteriaChange([...criteria, newItem.trim()]);
            setNewItem('');
        }
    };

    const handleRemoveItem = (itemToRemove: string) => {
        onCriteriaChange(criteria.filter(item => item !== itemToRemove));
    };

    const handleSuggestClick = async () => {
        setIsSuggesting(true);
        setError(null);
        try {
            const suggestions = await onSuggest();
            const newSuggestions = suggestions.filter(s => !criteria.find(c => c.toLowerCase() === s.toLowerCase()));
            onCriteriaChange([...criteria, ...newSuggestions]);
        } catch (err) {
            console.error(err);
            // Fix: Updated the error check to look for the generic 'API_KEY' instead of Vite-specific 'VITE_GEMINI_API_KEY'.
            if (err instanceof Error && err.message.includes('API_KEY')) {
                setError(err.message);
            } else {
                setError('Error al obtener sugerencias.');
            }
        } finally {
            setIsSuggesting(false);
        }
    };

    return (
        <div className={disabled ? 'opacity-50' : ''}>
            <label className="block text-sm font-medium text-slate-700 mb-2">{title}</label>
            <div className="flex flex-wrap gap-2 mb-2 p-2 border border-slate-200 rounded-md min-h-[42px] bg-slate-50">
                {criteria.map((item) => (
                    <span key={item} className="flex items-center gap-1.5 bg-sky-100 text-sky-800 text-sm font-medium px-2.5 py-1 rounded-full animate-fade-in">
                        {item}
                        <button type="button" onClick={() => handleRemoveItem(item)} className="text-sky-500 hover:text-sky-800 font-bold text-lg leading-none" aria-label={`Quitar ${item}`} disabled={disabled}>&times;</button>
                    </span>
                ))}
            </div>
            <div className="flex gap-2">
                <input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddItem(); } }} placeholder={placeholder} className="flex-grow p-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-200" disabled={disabled} />
                <button type="button" onClick={handleAddItem} className="px-4 py-2 text-sm font-semibold text-white bg-slate-600 rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:bg-slate-400" disabled={disabled}>Añadir</button>
            </div>
             <div className="mt-2 text-right">
                <button type="button" onClick={handleSuggestClick} disabled={isSuggesting || disabled} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200 disabled:opacity-50 transition-colors">
                    <SparklesIcon />
                    {isSuggesting ? 'Sugiriendo...' : 'Sugerir con IA'}
                </button>
                {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
            </div>
        </div>
    );
};


export const RubricForm: React.FC<RubricFormProps> = ({ onSubmit, isLoading }) => {
  const [stage, setStage] = useState<string>('');
  const [course, setCourse] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [evaluationElement, setEvaluationElement] = useState<string>('');
  const [levels, setLevels] = useState<string[]>(['Insuficiente', 'Suficiente', 'Bien', 'Notable', 'Sobresaliente']);
  const [newLevel, setNewLevel] = useState<string>('');
  const [specificCriteria, setSpecificCriteria] = useState<string[]>([]);
  
  const [evaluationCriteria, setEvaluationCriteria] = useState<WeightedCriterion[]>([]);
  const [newCriterionName, setNewCriterionName] = useState('');
  const [newCriterionWeight, setNewCriterionWeight] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string|null>(null);

  useEffect(() => {
    setCourse('');
    setSubject('');
  }, [stage]);

  const handleAddLevel = () => {
    if (newLevel.trim() && !levels.find(l => l.toLowerCase() === newLevel.trim().toLowerCase())) {
        setLevels([...levels, newLevel.trim()]);
        setNewLevel('');
    }
  };

  const handleRemoveLevel = (levelToRemove: string) => {
      setLevels(levels.filter(level => level !== levelToRemove));
  };
  
  const handleAddWeightedCriterion = () => {
      const weight = parseInt(newCriterionWeight, 10);
      if (newCriterionName.trim() && !isNaN(weight) && weight >= 0) {
          if (!evaluationCriteria.find(c => c.name.toLowerCase() === newCriterionName.trim().toLowerCase())) {
            setEvaluationCriteria([...evaluationCriteria, { name: newCriterionName.trim(), weight: weight }]);
            setNewCriterionName('');
            setNewCriterionWeight('');
          }
      }
  };

  const handleRemoveWeightedCriterion = (nameToRemove: string) => {
      setEvaluationCriteria(evaluationCriteria.filter(c => c.name !== nameToRemove));
  };

  const handleWeightChange = (name: string, newWeightStr: string) => {
      const newWeight = parseInt(newWeightStr, 10);
      setEvaluationCriteria(
          evaluationCriteria.map(c => c.name === name ? { ...c, weight: isNaN(newWeight) ? 0 : newWeight } : c)
      );
  };
  
  const handleSuggestWeightedCriteria = async () => {
      setIsSuggesting(true);
      setSuggestionError(null);
      try {
          const suggestions = await getSuggestions('evaluation') as WeightedCriterion[];
          const newSuggestions = suggestions
            .filter(s => !evaluationCriteria.find(c => c.name.toLowerCase() === s.name.toLowerCase()));
          
          setEvaluationCriteria([...evaluationCriteria, ...newSuggestions]);
      } catch (err) {
          console.error(err);
          // Fix: Updated the error check to look for the generic 'API_KEY' instead of Vite-specific 'VITE_GEMINI_API_KEY'.
          if (err instanceof Error && err.message.includes('API_KEY')) {
              setSuggestionError(err.message);
          } else {
              setSuggestionError('Error al obtener sugerencias.');
          }
      } finally {
          setIsSuggesting(false);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const stageLabel = ETAPAS_EDUCATIVAS.find(s => s.value === stage)?.label || stage;
    const courseLabel = CURSOS_POR_ETAPA[stage]?.find(c => c.value === course)?.label || course;
    const subjectLabel = ASIGNATURAS_POR_ETAPA[stage]?.find(s => s.value === subject)?.label || subject;
    onSubmit({ stage: stageLabel, course: courseLabel, subject: subjectLabel, evaluationElement, performanceLevels: levels, specificCriteria, evaluationCriteria });
  };
  
  const getSuggestions = (type: 'specific' | 'evaluation') => {
      const stageLabel = ETAPAS_EDUCATIVAS.find(s => s.value === stage)?.label || stage;
      const courseLabel = CURSOS_POR_ETAPA[stage]?.find(c => c.value === course)?.label || course;
      const subjectLabel = ASIGNATURAS_POR_ETAPA[stage]?.find(s => s.value === subject)?.label || subject;
      const context = { stage: stageLabel, course: courseLabel, subject: subjectLabel, evaluationElement };
      return generateCriteriaSuggestions(context, type);
  };

  const totalWeight = evaluationCriteria.reduce((sum, criterion) => sum + (criterion.weight || 0), 0);
  const isWeightOk = totalWeight === 100;
  
  const isContextSet = stage && course && subject && evaluationElement.trim() !== '';

  const courseOptions = CURSOS_POR_ETAPA[stage] || [];
  const subjectOptions = ASIGNATURAS_POR_ETAPA[stage] || [];

  const isFormValid = isContextSet && isWeightOk && evaluationCriteria.length > 0 && specificCriteria.length > 0;

  return (
    <div className="p-6 md:p-8 bg-white rounded-lg shadow-lg border border-slate-200">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="stage" className="block text-sm font-medium text-slate-700 mb-1">Etapa Educativa</label>
            <select id="stage" value={stage} onChange={(e) => setStage(e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
              <option value="" disabled>Selecciona una etapa...</option>
              {ETAPAS_EDUCATIVAS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1">Asignatura</label>
            <select id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} disabled={!stage} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-200">
              <option value="" disabled>Selecciona una asignatura...</option>
              {subjectOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="course" className="block text-sm font-medium text-slate-700 mb-1">Curso</label>
            <select id="course" value={course} onChange={(e) => setCourse(e.target.value)} disabled={!stage} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-200">
              <option value="" disabled>Selecciona un curso...</option>
              {courseOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
        </div>

        <div>
            <label htmlFor="evaluationElement" className="block text-sm font-medium text-slate-700 mb-1">Elemento a evaluar</label>
            <input type="text" id="evaluationElement" value={evaluationElement} onChange={(e) => setEvaluationElement(e.target.value)} placeholder="Ej: un cuaderno, un debate, la participación en clase..." className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required />
        </div>

        <hr/>
        
        <CriteriaSection 
            title="Criterios de Evaluación (Currículo LOMLOE)"
            criteria={specificCriteria}
            onCriteriaChange={setSpecificCriteria}
            onSuggest={() => getSuggestions('specific') as Promise<string[]>}
            placeholder="Añadir criterio con numeración (ej: 1.1)..."
            disabled={!isContextSet}
        />

        {/* Weighted Criteria Section */}
        <div className={!isContextSet ? 'opacity-50' : ''}>
            <label className="block text-sm font-medium text-slate-700 mb-2">Aspectos Específicos a Evaluar y Ponderación</label>
            <div className="space-y-2 mb-2">
                {evaluationCriteria.map((criterion) => (
                    <div key={criterion.name} className="flex items-center gap-2 p-2 border border-slate-200 rounded-md bg-slate-50 animate-fade-in">
                       <span className="flex-grow text-sm text-slate-800">{criterion.name}</span>
                       <input 
                         type="number" 
                         value={criterion.weight === 0 ? '' : criterion.weight}
                         onChange={(e) => handleWeightChange(criterion.name, e.target.value)}
                         className="w-20 p-1 text-center bg-white text-slate-900 border border-slate-300 rounded-md"
                         placeholder="%"
                         disabled={!isContextSet}
                       />
                        <button type="button" onClick={() => handleRemoveWeightedCriterion(criterion.name)} className="text-red-500 hover:text-red-800 font-bold text-lg leading-none" aria-label={`Quitar ${criterion.name}`} disabled={!isContextSet}>&times;</button>
                    </div>
                ))}
            </div>
             <div className="flex gap-2">
                <input type="text" value={newCriterionName} onChange={(e) => setNewCriterionName(e.target.value)} placeholder="Añadir aspecto observable (ej: Limpieza)..." className="flex-grow p-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-200" disabled={!isContextSet}/>
                <input type="number" value={newCriterionWeight} onChange={(e) => setNewCriterionWeight(e.target.value)} placeholder="%" className="w-24 p-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-200" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddWeightedCriterion(); } }} disabled={!isContextSet}/>
                <button type="button" onClick={handleAddWeightedCriterion} className="px-4 py-2 text-sm font-semibold text-white bg-slate-600 rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:bg-slate-400" disabled={!isContextSet}>Añadir</button>
            </div>
             <div className="flex justify-between items-center mt-2">
                <p className={`text-sm font-semibold ${isWeightOk ? 'text-green-600' : 'text-red-600'}`}>
                    Total ponderado: {totalWeight}%
                </p>
                <button type="button" onClick={handleSuggestWeightedCriteria} disabled={isSuggesting || !isContextSet} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200 disabled:opacity-50 transition-colors">
                    <SparklesIcon />
                    {isSuggesting ? 'Sugiriendo...' : 'Sugerir con IA'}
                </button>
             </div>
             {suggestionError && <p className="text-xs text-red-600 mt-1 text-right">{suggestionError}</p>}
        </div>

        <hr/>
        
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
                Niveles de desempeño (personalizables)
            </label>
            <div className="flex flex-wrap gap-2 mb-2 p-2 border border-slate-200 rounded-md min-h-[42px] bg-slate-50">
                {levels.map((level) => (
                <span key={level} className="flex items-center gap-1.5 bg-indigo-100 text-indigo-800 text-sm font-medium px-2.5 py-1 rounded-full animate-fade-in">
                    {level}
                    <button type="button" onClick={() => handleRemoveLevel(level)} className="text-indigo-500 hover:text-indigo-800 font-bold text-lg leading-none" aria-label={`Quitar ${level}`}>&times;</button>
                </span>
                ))}
            </div>
            <div className="flex gap-2">
                <input type="text" value={newLevel} onChange={(e) => setNewLevel(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddLevel(); } }} placeholder="Añadir nuevo nivel..." className="flex-grow p-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                <button type="button" onClick={handleAddLevel} className="px-4 py-2 text-sm font-semibold text-white bg-slate-600 rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500">Añadir</button>
            </div>
        </div>

        <div className="pt-2">
          <button type="submit" disabled={isLoading || !isFormValid} className="w-full flex justify-center items-center gap-2 p-3 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors duration-200">
            <MagicWandIcon />
            {isLoading ? 'Generando...' : 'Generar Rúbrica'}
          </button>
          {!isWeightOk && evaluationCriteria.length > 0 && <p className="text-xs text-center text-red-600 mt-2">La ponderación total debe ser exactamente 100% para poder generar la rúbrica.</p>}
        </div>
      </form>
    </div>
  );
};