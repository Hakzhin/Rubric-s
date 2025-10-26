// src/services/geminiService.ts
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { FormData, Rubric, RubricItem, WeightedCriterion } from "../types";

// En Netlify define API_KEY en Site settings → Build & deploy → Environment
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const MODEL_NAME = process.env.MODEL_NAME ?? "gemini-1.5-flash"; // o "gemini-1.5-pro"

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

  const prompt = `Eres un experto en pedagogía y diseño curricular. Tu tarea es crear una rúbrica de evaluación detallada, coherente y con puntuaciones.

**Contexto de la Evaluación:**
- **Elemento a evaluar:** ${evaluationElement}
- **Etapa Educativa:** ${stage}
- **Curso:** ${course}
- **Asignatura:** ${subject}
- **Criterios de Evaluación (Currículo LOMLOE):** ${specificCriteria.join("; ")}
- **Aspectos Específicos a Evaluar (que serán los ítems de la rúbrica):** ${itemNames.join("; ")}

**Instrucciones para la Rúbrica:**
1. El título de la rúbrica debe ser conciso y reflejar que se está evaluando "${evaluationElement}" en la asignatura de "${subject}".
2. Los ítems ('itemName') deben ser **exactamente** los "Aspectos Específicos a Evaluar". Total: **${itemCount}**.
3. Usa los niveles, de menor a mayor: **${performanceLevels.join(", ")}** (nombres exactos).
4. Escala estándar:
   - Insuficiente: "0-4"
   - Suficiente: "5"
   - Bien: "6"
   - Notable: "7-8"
   - Sobresaliente: "9-10"
   Si hay niveles personalizados, asígnales puntuación coherente.
5. Los encabezados de la escala incluyen nivel y puntuación.
6. Las descripciones por nivel deben ser claras, observables y progresivas, basadas en los criterios LOMLOE.

Devuelve **solo** JSON en el formato del schema.`;

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
          required: ["itemName", "descriptors"],
        },
      },
    },
    required: ["title", "scaleHeaders", "items"],
  } as const;

  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.8,
    },
  });

  const jsonText = result.response.text().trim();
  const parsedData = JSON.parse(jsonText);

  if (!parsedData.title || !Array.isArray(parsedData.items)) {
    throw new Error("Formato de respuesta de la IA inválido.");
  }

  const itemsWithWeights: RubricItem[] = parsedData.items.map(
    (item: Omit<RubricItem, "weight">) => {
      const original = evaluationCriteria.find((c) => c.name === item.itemName);
      return { ...item, weight: original ? original.weight : 0 };
    }
  );

  const finalRubric: Rubric = {
    ...parsedData,
    items: itemsWithWeights,
    specificCriteria: formData.specificCriteria,
  };

  return finalRubric;
}

export async function generateCriteriaSuggestions(
  context: Pick<FormData, "stage" | "course" | "subject" | "evaluationElement">,
  criteriaType: "specific" | "evaluation"
): Promise<string[] | WeightedCriterion[]> {
  const { stage, course, subject, evaluationElement } = context;

  let prompt: string;
  let responseSchema: any;

  if (criteriaType === "specific") {
    const typeDescription =
      "Criterios de Evaluación del currículo oficial LOMLOE de la Región de Murcia";
    const examples =
      'Por ejemplo: "1.1. Comprender e interpretar el sentido global...", "3.2. Producir textos escritos y multimodales..."';
    const taskInstruction = `Genera una lista de 4 o 5 **${typeDescription}** relevantes para evaluar un "${evaluationElement}". **Incluye la numeración oficial** (ej: 1.1, 2.3...).\n${examples}`;

    prompt = `Contexto:
- Etapa: ${stage}
- Asignatura: ${subject}
- Curso: ${course}
- Elemento a evaluar: ${evaluationElement}

Tarea:
${taskInstruction}

Devuelve **solo** un array JSON de strings.`;

    responseSchema = { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } };
  } else {
    const typeDescription =
      "Aspectos observables o destrezas evaluables con una ponderación sugerida";
    const examples =
      'Ej.: [{ "name": "Expresar opiniones de forma argumentada", "weight": 40 }, { "name": "Respetar el turno de palabra", "weight": 30 }, { "name": "Uso de vocabulario específico", "weight": 30 }]';
    const taskInstruction = `Genera 4 o 5 **${typeDescription}** para este contexto. **Asigna "weight" (número)** y que la suma sea **exactamente 100**.\n${examples}`;

    prompt = `Contexto:
- Etapa: ${stage}
- Asignatura: ${subject}
- Curso: ${course}
- Elemento a evaluar: ${evaluationElement}

Tarea:
${taskInstruction}

Devuelve **solo** un array JSON de objetos { "name": string, "weight": number }.`;

    responseSchema = {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          weight: { type: SchemaType.NUMBER },
        },
        required: ["name", "weight"],
      },
    };
  }

  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.7,
    },
  });

  const jsonText = result.response.text().trim();
  const parsedData = JSON.parse(jsonText);

  if (criteriaType === "specific") {
    if (!Array.isArray(parsedData) || !parsedData.every((s: any) => typeof s === "string")) {
      throw new Error("Invalid format from AI for suggestions.");
    }
    return parsedData;
  } else {
    if (
      !Array.isArray(parsedData) ||
      !parsedData.every(
        (o: any) => o && typeof o === "object" && typeof o.name === "string" && typeof o.weight === "number"
      )
    ) {
      throw new Error("Invalid format from AI for weighted suggestions.");
    }
    return parsedData as WeightedCriterion[];
  }
}
