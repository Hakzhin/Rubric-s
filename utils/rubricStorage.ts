import type { Rubric, FormData } from '../types';

export interface SavedRubric {
  id: string;
  rubric: Rubric;
  formData: FormData;
  createdAt: string;
  title: string;
}

const STORAGE_KEY = 'saved_rubrics';
const MAX_SAVED_RUBRICS = 10;

export const saveRubricToStorage = (rubric: Rubric, formData: FormData): void => {
  try {
    const saved = getSavedRubrics();
    const newRubric: SavedRubric = {
      id: Date.now().toString(),
      rubric,
      formData,
      createdAt: new Date().toISOString(),
      title: rubric.title
    };
    
    // Add to beginning of array and limit to MAX_SAVED_RUBRICS
    const updated = [newRubric, ...saved].slice(0, MAX_SAVED_RUBRICS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving rubric:', error);
  }
};

export const getSavedRubrics = (): SavedRubric[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading rubrics:', error);
    return [];
  }
};

export const deleteRubric = (id: string): void => {
  try {
    const saved = getSavedRubrics();
    const filtered = saved.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting rubric:', error);
  }
};

export const loadRubric = (id: string): SavedRubric | null => {
  const saved = getSavedRubrics();
  return saved.find(r => r.id === id) || null;
};
