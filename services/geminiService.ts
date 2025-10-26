/// <reference types="vite/client" />

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { FormData, Rubric } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY no está configurada');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

export async function generateRubric(formData: FormData): Promise<Rubric> {
  if (!apiKey) {
    throw new Error('La API key de Gemini no está configurada. Por favor, configúrala en las variables de entorno.');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
Eres un experto en diseño de rúbricas de evaluación educativa basadas en la LOMLOE para el sistema educativo español.

Genera una rúbrica de evaluación en formato JSON con la siguiente información:

**Contexto:**
- Etapa educativa: ${formData.stage}
- Curso: ${formData.course}
- Asignatura: ${formData.subject}
- Elemento de evaluación: ${formData.evaluationElement}
- Niveles de desempeño: ${formData.performanceLevels.join(', ')}
- Criterios específicos a evaluar: ${formData.specificCriteria.join('; ')}
- Criterios de evaluación ponderados: ${formData.evaluationCriteria.map(c => `${c.name} (${c.weight}%)`).join('; ')}

**Requisitos de la rúbrica:**
1. El título debe ser claro y descriptivo
2. Los niveles de desempeño (scaleHeaders) deben corresponder exactamente a: ${formData.performanceLevels.join(', ')}
3. Cada nivel debe tener una puntuación numérica asociada
4. Cada criterio de evaluación debe tener descriptores detallados para cada nivel de desempeño
5. Los descriptores deben ser claros, observables y medibles
6. Deben estar alineados con la normativa LOMLOE
7. La suma de los pesos debe ser 100%

**Formato JSON requerido:**
{
  "title": "Título de la rúbrica",
  "scaleHeaders": [
    { "level": "Nivel1", "score": "10" },
    { "level": "Nivel2", "score": "8" }
  ],
  "items": [
    {
      "itemName": "Nombre del criterio",
      "weight": 25,
      "descriptors": [
        { "level": "Nivel1", "description": "Descripción detallada", "score": "10" },
        { "level": "Nivel2", "description": "Descripción detallada", "score": "8" }
      ]
    }
  ],
  "specificCriteria": ["Criterio específico 1", "Criterio específico 2"]
}

Genera SOLO el JSON válido, sin texto adicional antes o después.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Limpiar markdown si existe
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '').trim();
    }
    
    const rubric: Rubric = JSON.parse(jsonText);
    
    // Validación básica
    if (!rubric.title || !rubric.scaleHeaders || !rubric.items) {
      throw new Error('El formato de la rúbrica generada no es válido');
    }
    
    return rubric;
  } catch (error) {
    console.error('Error al generar la rúbrica:', error);
    throw new Error('No se pudo generar la rúbrica. Por favor, verifica tu conexión y la API key.');
  }
}
