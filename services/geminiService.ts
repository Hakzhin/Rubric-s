/// <reference types="vite/client" />

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { FormData, Rubric, RubricItem } from "../types";

// ✅ SOLO VITE_GEMINI_API_KEY (cliente)
const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
if (!apiKey) {
  console.error("❌ VITE_GEMINI_API_KEY no está configurada.");
  throw new Error("Configura VITE_GEMINI_API_KEY en tu .env(.local).");
}

const genAI = new GoogleGenerativeAI(apiKey);

// Limpia fences y BOM; parsea JSON con tolerancia
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

  // ✅ Construcción segura del prompt para evitar "Unterminated string literal"
  const prompt = [
    "Eres experto en diseño de rúbricas educativas basadas en la LOMLOE.",
    "Devuelve SOLO un JSON válido con esta estructura:",
    "",
    "{",
    '  "title": "Título de la rúbrica",',
    '  "scaleHeaders": [',
    '    { "level": "Nivel1", "score": "10" },',
    '    { "level": "Nivel2", "score": "8" }',
    "  ],",
    '  "items": [',
    "    {",
    '      "itemName": "Nombre del criterio",',
    '      "weight": 25,',
    '      "descriptors": [',
    '        { "level": "Nivel1", "description": "Descripción", "score": "10" },',
    '        { "level": "Nivel2", "description": "Descripción", "score": "8" }',
    "      ]",
    "    }",
    "  ],",
    '  "specificCriteria": ["Criterio específico 1", "Criterio específico 2"]',
    "}",
    "",
    "Contexto:",
    `- Etapa: ${stage}`,
    `- Curso: ${course}`,
    `- Asignatura: ${subject}`,
    `- Elemento de evaluación: ${evaluationElement}`,
    `- Niveles de desempeño (ordenados): ${performanceLevels.join(", ")}`,
    `- Criterios LOMLOE: ${specificCriteria.join("; ")}`,
    `- Ítems (exactamente ${itemCount}): ${itemNames.join("; ")}`,
    `- Pesos esperados: ${evaluationCriteria
      .map((c) => `${c.name} (${c.weight}%)`)
      .join("; ")}`,
    "",
    "Reglas:",
    "1) Usa exactamente esos ítems y niveles.",
    "2) Descripciones observables, medibles y progresivas (menor→mayor dominio).",
    "3) La suma total de los pesos debe ser 100%.",
    "4) No incluyas texto fuera del JSON.",
  ].join("\n");

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
            weight: { type: SchemaType.NUMBER },
            descriptors: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  level: { type: SchemaType.STRING },
                  description: { type: SchemaType.STRING },
                  score: { type: SchemaType.STRING },
                },
                required: ["level", "description", "score"],
              },
            },
          },
          required: ["itemName", "weight", "descriptors"],
        },
      },
      specificCriteria: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
      },
    },
    required: ["title", "scaleHeaders", "items", "specificCriteria"],
  } as const;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.6,
      },
    });

    // Compatibilidad: text() puede ser sync o promesa
    const maybe = result?.response?.text?.();
    const raw =
      typeof (maybe as any)?.then === "function"
        ? await (maybe as any)
        : (maybe as string);

    if (typeof raw !== "string") throw new Error("Respuesta inválida del modelo.");

    const parsed = safeParseJson(raw);

    if (!parsed?.title || !Array.isArray(parsed?.items)) {
      throw new Error("La rúbrica generada no tiene formato válido.");
    }

    // Reforzar pesos con lo enviado por el usuario
    const weightMap = new Map(evaluationCriteria.map((c) => [c.name, c.weight]));
    const items: RubricItem[] = parsed.items.map((it: RubricItem) => ({
      ...it,
      weight: weightMap.get(it.itemName) ?? it.weight ?? 0,
    }));

    // Normalizar suma a 100 (si hace falta)
    const total = items.reduce((a, b) => a + (b.weight ?? 0), 0);
    if (total && total !== 100) {
      const factor = 100 / total;
      let sum = 0;
      const normalized = items.map((it) => {
        const w = Math.round((it.weight ?? 0) * factor);
        sum += w;
        return { ...it, weight: w };
      });
      const diff = 100 - sum;
      if (diff && normalized.length) normalized[0].weight += diff;
      parsed.items = normalized;
