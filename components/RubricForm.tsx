



import React, { useState, useEffect } from 'react';
import { ETAPAS_EDUCATIVAS, CURSOS_POR_ETAPA, ASIGNATURAS_POR_ETAPA } from '../constants';
import { generateCriteriaSuggestions } from '../services/geminiService';
import type { FormData, WeightedCriterion } from '../types';
import { GraduationCapIcon } from './icons/GraduationCapIcon';
import { GeminiIcon } from './icons/GeminiIcon';
import { useLanguage } from '../hooks/useLanguage';
import type { TranslationKey } from '../translations';

interface RubricFormProps {
  onSubmit: (formData: FormData) => void;
  isLoading: boolean;
  initialData?: FormData | null;
  onReset: () => void;
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
    const { t } = useLanguage();
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
            onCriteriaChange(suggestions); // FIX: Replace instead of append
        } catch (err) {
            console.error(err);
            if (err instanceof Error) {
                const key = err.message as TranslationKey;
                const translatedError = t(key);
                setError(translatedError === key ? t('error_getting_suggestions') : translatedError);
            } else {
                setError(t('error_getting_suggestions'));
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
                    <span key={item} className="flex items-center gap-1.5 bg-sky-100 text-sky-800 text-sm font-medium px-2.5 py-1 rounded-full animate-swoop-in-item">
                        {item}
                        <button type="button" onClick={() => handleRemoveItem(item)} className="text-sky-500 hover:text-sky-800 font-bold text-lg leading-none" aria-label={`${t('remove_item')} ${item}`} disabled={disabled}>&times;</button>
                    </span>
                ))}
            </div>
            <div className="flex gap-2">
                <input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddItem(); } }} placeholder={placeholder} className="flex-grow p-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-200" disabled={disabled} />
                <button type="button" onClick={handleAddItem} className="px-4 py-2 text-sm font-semibold text-white bg-slate-600 rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:bg-slate-400" disabled={disabled}>{t('add')}</button>
            </div>
             <div className="mt-2 text-right">
                <div className="flex justify-end items-center gap-3">
                    <p className="text-xs text-slate-500 italic">{t('ai_suggestion_disclaimer')}</p>
                    <button type="button" onClick={handleSuggestClick} disabled={isSuggesting || disabled} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200 disabled:opacity-50 transition-colors flex-shrink-0">
                        <GeminiIcon />
                        {isSuggesting ? t('suggesting') : t('suggest_with_ai')}
                    </button>
                </div>
                {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
            </div>
        </div>
    );
};


export const RubricForm: React.FC<RubricFormProps> = ({ onSubmit, isLoading, initialData, onReset }) => {
  const { t } = useLanguage();
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
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setCourse('');
    setSubject('');
  }, [stage]);

  // This useEffect now ONLY handles loading data from a saved rubric.
  // The reset logic is handled directly in the confirmReset function.
  useEffect(() => {
    if (initialData) {
        const findStageValue = (label: string) => ETAPAS_EDUCATIVAS.find(e => e.label === label)?.value || '';
        const stageValue = findStageValue(initialData.stage);
        
        if (stageValue) {
            setStage(stageValue);
            // We need to wait for the stage to update to get the correct course/subject options
            // So we set them in a separate effect or directly if possible
            const findCourseValue = (stgVal: string, label: string) => CURSOS_POR_ETAPA[stgVal]?.find(c => c.label === label)?.value || '';
            setCourse(findCourseValue(stageValue, initialData.course));

            const findSubjectValue = (stgVal: string, label: string) => ASIGNATURAS_POR_ETAPA[stgVal]?.find(s => s.label === label)?.value || '';
            setSubject(findSubjectValue(stageValue, initialData.subject));
        } else {
            setStage('');
            setCourse('');
            setSubject('');
        }

        setEvaluationElement(initialData.evaluationElement);
        setLevels(initialData.performanceLevels);
        setSpecificCriteria(initialData.specificCriteria);
        setEvaluationCriteria(initialData.evaluationCriteria);
    }
  }, [initialData]);

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
          setEvaluationCriteria(suggestions); // FIX: Replace instead of append
      } catch (err) {
          console.error(err);
          if (err instanceof Error) {
              const key = err.message as TranslationKey;
              const translatedError = t(key);
              setSuggestionError(translatedError === key ? t('error_getting_suggestions') : translatedError);
          } else {
              setSuggestionError(t('error_getting_suggestions'));
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

  const handleResetForm = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    // 1. Tell the parent App component to reset its state (the generated rubric, etc.)
    onReset();

    // 2. Directly reset all local state within this form component.
    setStage('');
    setCourse('');
    setSubject('');
    setEvaluationElement('');
    setLevels(['Insuficiente', 'Suficiente', 'Bien', 'Notable', 'Sobresaliente']);
    setSpecificCriteria([]);
    setEvaluationCriteria([]);
    setNewLevel('');
    setNewCriterionName('');
    setNewCriterionWeight('');
    setSuggestionError(null);

    // 3. Close the confirmation modal and scroll to the top.
    setShowResetConfirm(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelReset = () => {
    setShowResetConfirm(false);
  };

  const totalWeight = evaluationCriteria.reduce((sum, criterion) => sum + (criterion.weight || 0), 0);
  const isWeightOk = totalWeight === 100;
  
  const isContextSet = stage && course && subject && evaluationElement.trim() !== '';

  const courseOptions = CURSOS_POR_ETAPA[stage] || [];
  const subjectOptions = ASIGNATURAS_POR_ETAPA[stage] || [];

  const isFormValid = isContextSet && isWeightOk && evaluationCriteria.length > 0 && specificCriteria.length > 0;

  return (
    <>
      <div className="p-6 md:p-8 bg-slate-100 rounded-lg shadow-lg border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">{t('rubric_config')}</h2>
          <button
            onClick={handleResetForm}
            type="button"
            className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 rounded-lg shadow-sm transition-colors"
            title={t('reset_form_title')}
          >
            🔄 {t('reset')}
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="stage" className="block text-sm font-medium text-slate-700 mb-1">{t('educational_stage')}</label>
              <select id="stage" value={stage} onChange={(e) => setStage(e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                <option value="" disabled>{t('select_stage')}</option>
                {ETAPAS_EDUCATIVAS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1">{t('subject')}</label>
              <select id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} disabled={!stage} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-200">
                <option value="" disabled>{t('select_subject')}</option>
                {subjectOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="course" className="block text-sm font-medium text-slate-700 mb-1">{t('course')}</label>
              <select id="course" value={course} onChange={(e) => setCourse(e.target.value)} disabled={!stage} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-200">
                <option value="" disabled>{t('select_course')}</option>
                {courseOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          </div>

          <div>
              <label htmlFor="evaluationElement" className="block text-sm font-medium text-slate-700 mb-1">{t('element_to_evaluate')}</label>
              <input type="text" id="evaluationElement" value={evaluationElement} onChange={(e) => setEvaluationElement(e.target.value)} placeholder={t('element_to_evaluate_placeholder')} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required />
          </div>

          <hr/>
          
          <CriteriaSection 
              title={t('evaluation_criteria_lomloe')}
              criteria={specificCriteria}
              onCriteriaChange={setSpecificCriteria}
              onSuggest={() => getSuggestions('specific') as Promise<string[]>}
              placeholder={t('add_criteria_placeholder')}
              disabled={!isContextSet}
          />

          {/* Weighted Criteria Section */}
          <div className={!isContextSet ? 'opacity-50' : ''}>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('specific_aspects_to_evaluate')}</label>
              <div className="space-y-2 mb-2">
                  {evaluationCriteria.map((criterion) => (
                      <div key={criterion.name} className="flex items-center gap-2 p-2 border border-slate-200 rounded-md bg-slate-50 animate-swoop-in-item">
                        <span className="flex-grow text-sm text-slate-800">{criterion.name}</span>
                        <input 
                          type="number" 
                          value={criterion.weight === 0 ? '' : criterion.weight}
                          onChange={(e) => handleWeightChange(criterion.name, e.target.value)}
                          className="w-20 p-1 text-center bg-white text-slate-900 border border-slate-300 rounded-md"
                          placeholder="%"
                          disabled={!isContextSet}
                        />
                          <button type="button" onClick={() => handleRemoveWeightedCriterion(criterion.name)} className="text-red-500 hover:text-red-800 font-bold text-lg leading-none" aria-label={`${t('remove_item')} ${criterion.name}`} disabled={!isContextSet}>&times;</button>
                      </div>
                  ))}
              </div>
              <div className="flex gap-2">
                  <input type="text" value={newCriterionName} onChange={(e) => setNewCriterionName(e.target.value)} placeholder={t('add_observable_aspect_placeholder')} className="flex-grow p-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-200" disabled={!isContextSet}/>
                  <input type="number" value={newCriterionWeight} onChange={(e) => setNewCriterionWeight(e.target.value)} placeholder="%" className="w-24 p-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-200" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddWeightedCriterion(); } }} disabled={!isContextSet}/>
                  <button type="button" onClick={handleAddWeightedCriterion} className="px-4 py-2 text-sm font-semibold text-white bg-slate-600 rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:bg-slate-400" disabled={!isContextSet}>{t('add')}</button>
              </div>
              <div className="flex justify-between items-center mt-2">
                  <p className={`text-sm font-semibold ${isWeightOk ? 'text-green-600' : 'text-red-600'}`}>
                      {t('weighted_total')}: {totalWeight}%
                  </p>
                  <button type="button" onClick={handleSuggestWeightedCriteria} disabled={isSuggesting || !isContextSet} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200 disabled:opacity-50 transition-colors">
                      <GeminiIcon />
                      {isSuggesting ? t('suggesting') : t('suggest_with_ai')}
                  </button>
              </div>
              {suggestionError && <p className="text-xs text-red-600 mt-1 text-right">{suggestionError}</p>}
          </div>

          <hr/>
          
          <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('performance_levels_customizable')}
              </label>
              <div className="flex flex-wrap gap-2 mb-2 p-2 border border-slate-200 rounded-md min-h-[42px] bg-slate-50">
                  {levels.map((level) => (
                  <span key={level} className="flex items-center gap-1.5 bg-indigo-100 text-indigo-800 text-sm font-medium px-2.5 py-1 rounded-full animate-fade-in">
                      {level}
                      <button type="button" onClick={() => handleRemoveLevel(level)} className="text-indigo-500 hover:text-indigo-800 font-bold text-lg leading-none" aria-label={`${t('remove_item')} ${level}`}>&times;</button>
                  </span>
                  ))}
              </div>
              <div className="flex gap-2">
                  <input type="text" value={newLevel} onChange={(e) => setNewLevel(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddLevel(); } }} placeholder={t('add_new_level_placeholder')} className="flex-grow p-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                  <button type="button" onClick={handleAddLevel} className="px-4 py-2 text-sm font-semibold text-white bg-slate-600 rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500">{t('add')}</button>
              </div>
          </div>

          <div className="pt-4">
            <button type="submit" disabled={isLoading || !isFormValid} className="w-full flex justify-center items-center gap-2 p-3 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors duration-200">
              <GraduationCapIcon />
              {isLoading ? t('generating') : t('generate_rubric')}
            </button>
            {!isWeightOk && evaluationCriteria.length > 0 && <p className="text-xs text-center text-red-600 mt-2">{t('weighting_must_be_100')}</p>}
          </div>
        </form>
      </div>
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 no-print" onClick={cancelReset}>
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-2xl" role="img" aria-label="Warning">⚠️</span>
              </div>
              <div className="flex-grow">
                <h3 className="text-lg font-bold text-slate-800 mb-2">
                  {t('reset_form_modal_title')}
                </h3>
                <p className="text-slate-600 text-sm mb-6">
                  {t('reset_form_modal_text')}
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={cancelReset}
                    className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={confirmReset}
                    className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
                  >
                    {t('yes_reset')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};