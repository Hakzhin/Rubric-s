/// <reference types="vite/client" />

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { FormData, Rubric, RubricItem } from "../types";

// ✅ SOLO VITE_GEMINI_API_KEY (visible en el cliente)
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ VITE_GEMINI_API_KEY no está configurada en el entorno.");
  throw new Error(
    "La API key de Gemini no está configurada. Añádela al archivo .env como VITE_GEMINI_API_KEY."
  );
}

const genAI = new GoogleGenerativeAI(apiKey);

// 🔧 Utilidad: limpia texto con ```json o ``` y parsea de forma segura
function safeParseJson(raw: string) {
  const cleaned = raw
    .replace(/^\uFEFF/, "")
    .replace(/```json\s*([\s\S]*?)\s*```/gi, "$1")
    .replace(/```([\s\S]*?)```/g, "$1")
    .trim();
  return JSON.parse(cleaned);
}

export async function generateRubric(formData: FormData): Promise<Rubric> {
  const {
    stage,
    course,
    subject,
    evaluationElement,
    performanceLevels,
    specificCriteria,
    evaluationCriteria,
  } = formData;

  const itemNames = evaluationCriteria.map((c) => c.name);
  const itemCount = itemNames.length;

  const prompt = `
Eres experto en diseño de rúbricas educativas basadas en la LOMLOE. 
Devuelve SOLO un JSON válido con esta estructura:

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
        { "level": "Nivel1", "description": "Descripción", "score": "10" },
        { "level": "Nivel2", "description": "Descripción", "score": "8" }
      ]
    }
  ],
  "specificCriteria": ["Criterio específico 1", "Criterio específico 2"]
}

**Contexto:**
- Etapa: ${stage}
- Curso: ${course}
- Asignatura: ${subject}
- Elemento de evaluación: ${evaluationElement}
- Niveles de desempeño (ordenados): ${performanceLevels.join(", ")}
- Criterios LOMLOE: ${specificCriteria.join("; ")}
- Ítems (exactamente ${itemCount}): ${itemNames.join("; ")}
- Pesos esperados: ${evaluationCriteria
    .map((c) => `${c.name} (${c.weight}%)`)
    .join("; ")}

**Reglas:**
1. Usa exactamente esos ítems y niveles.
2. Las descripciones deben ser observables, medibles y progresivas.
3. La suma total de los pesos debe ser 100%.
4. No incluyas texto fuera del JSON.
`;

  const responseSchema = {
    type: SchemaType.OBJECT,
    properties: {
      title: { type: SchemaType.STRING },
      scaleHeaders: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            level: { type: SchemaType.STRING },
            score: { type: SchemaType.STRING },
          },
          required: ["level", "score"],
        },
      },
      items: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            itemName: { type: SchemaType.STRING },
            weight: { type: SchemaType.NUMBE
