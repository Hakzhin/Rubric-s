import { GoogleGenAI, Type } from "@google/genai";
import type { FormData, Rubric, RubricItem, WeightedCriterion } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateRubric(formData: FormData): Promise<Rubric> {
  const { stage, course, subject, evaluationElement, performanceLevels, specificCriteria, evaluationCriteria } = formData;

  const itemNames = evaluationCriteria.map(c => c.name);
  const itemCount = itemNames.length;

  const prompt = `Eres un experto en pedagogía y diseño curricular. Tu tarea es crear una rúbrica de evaluación detallada, coherente y con puntuaciones.

    **Contexto de la Evaluación:**
    -   **Elemento a evaluar:** ${evaluationElement}
    -   **Etapa Educativa:** ${stage}
    -   **Curso:** ${course}
    -   **Asignatura:** ${subject}
    -   **Criterios de Evaluación (Currículo LOMLOE):** ${specificCriteria.join('; ')}
    -   **Aspectos Específicos a Evaluar (que serán los ítems de la rúbrica):** ${itemNames.join('; ')}

    **Instrucciones para la Rúbrica:**
    1.  El título de la rúbrica debe ser conciso y reflejar que se está evaluando "${evaluationElement}" en la asignatura de "${subject}".
    2.  Los ítems de evaluación de la rúbrica ('itemName') deben ser **exactamente** los "Aspectos Específicos a Evaluar" proporcionados. Habrá un total de **${itemCount}** ítems. Para cada uno de los "Aspectos Específicos a Evaluar", crea una fila en la rúbrica.
    3.  Usa los siguientes niveles de desempeño, ordenados de menor a mayor: **${performanceLevels.join(', ')}**. Debes usar estos nombres exactos.
    4.  Asigna una puntuación a cada nivel de desempeño basándote en la siguiente escala ESTÁNDAR. Debes usar estos rangos/valores exactos para los niveles correspondientes:
        - Insuficiente: "0-4"
        - Suficiente: "5"
        - Bien: "6"
        - Notable: "7-8"
        - Sobresaliente: "9-10"
        Si el usuario ha proporcionado un nivel de desempeño personalizado que no está en esta lista, asígnale una puntuación coherente que encaje con la progresión.
    5.  Los encabezados de la escala deben incluir el nombre del nivel y su puntuación.
    6.  Las descripciones para cada nivel dentro de un ítem deben ser claras, observables y mostrar una progresión lógica de dominio, desde el nivel más bajo al más alto. Estas descripciones deben estar fundamentadas en los "Criterios de Evaluación (Currículo LOMLOE)" proporcionados.

    Genera la respuesta estrictamente en el formato JSON especificado en el schema.`;
    
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: "Un título conciso y descriptivo para la rúbrica."
        },
        scaleHeaders: {
          type: Type.ARRAY,
          description: `Un array de objetos con exactamente ${performanceLevels.length} encabezados para la escala, ordenados de menor a mayor logro. Cada objeto debe contener el nivel (nombre) y una puntuación en formato de texto.`,
          items: {
            type: Type.OBJECT,
            properties: {
              level: { type: Type.STRING, description: "El nombre del nivel de desempeño." },
              score: { type: Type.STRING, description: "La puntuación en formato de texto para este nivel (ej: '5', '7-8')." }
            },
            required: ['level', 'score']
          }
        },
        items: {
          type: Type.ARRAY,
          description: `Un array con exactamente ${itemCount} objetos, cada uno representando un ítem de evaluación.`,
          items: {
            type: Type.OBJECT,
            properties: {
              itemName: {
                type: Type.STRING,
                description: "El nombre del ítem de evaluación. Debe ser uno de los 'Aspectos Específicos a Evaluar' proporcionados."
              },
              descriptors: {
                type: Type.ARRAY,
                description: `Un array con exactamente ${performanceLevels.length} objetos, cada uno describiendo un nivel de desempeño para el ítem.`,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    level: {
                      type: Type.STRING,
                      description: "El nivel de la escala al que corresponde esta descripción (debe coincidir con un scaleHeader)."
                    },
                    description: {
                      type: Type.STRING,
                      description: "La descripción específica y observable del desempeño del estudiante en este nivel para este ítem."
                    },
                    score: {
                        type: Type.STRING,
                        description: "La puntuación en formato de texto para este nivel (debe coincidir con el score del scaleHeader)."
                    }
                  },
                  required: ['level', 'description', 'score']
                }
              }
            },
            required: ['itemName', 'descriptors']
          }
        }
      },
      required: ['title', 'scaleHeaders', 'items']
    };


  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.8,
      }
    });
    
    const jsonText = response.text.trim();
    const parsedData = JSON.parse(jsonText);

    if (!parsedData.title || !Array.isArray(parsedData.items)) {
        throw new Error("Formato de respuesta de la IA inválido.");
    }

    // Add weights back to the items from the original form data
    const itemsWithWeights: RubricItem[] = parsedData.items.map((item: Omit<RubricItem, 'weight'>) => {
        const originalCriterion = evaluationCriteria.find(c => c.name === item.itemName);
        return {
            ...item,
            weight: originalCriterion ? originalCriterion.weight : 0,
        };
    });

    const finalRubric: Rubric = {
        ...parsedData,
        items: itemsWithWeights,
        specificCriteria: formData.specificCriteria,
    };

    return finalRubric;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("No se pudo generar la rúbrica desde el servicio de IA.");
  }
}

export async function generateCriteriaSuggestions(
  context: Pick<FormData, 'stage' | 'course' | 'subject' | 'evaluationElement'>,
  criteriaType: 'specific' | 'evaluation'
): Promise<string[] | WeightedCriterion[]> {
    const { stage, course, subject, evaluationElement } = context;

    let prompt: string;
    let responseSchema: any;

    if (criteriaType === 'specific') {
        const typeDescription = 'Criterios de Evaluación del currículo oficial LOMLOE de la Región de Murcia';
        const examples = 'Por ejemplo: "1.1. Comprender e interpretar el sentido global...", "3.2. Producir textos escritos y multimodales..."';
        const taskInstruction = `Genera una lista de 4 o 5 **${typeDescription}** que sean los más relevantes para evaluar un "${evaluationElement}" en este contexto. **Debes incluir su numeración oficial** (ej: 1.1, 2.3, etc.) tal como aparece en el currículo.\n${examples}`;
        
        prompt = `Eres un asistente experto en el diseño de currículos educativos, especializado en la normativa de la Región de Murcia (Educarm) para la LOMLOE.

        **Contexto:**
        - **Etapa Educativa:** ${stage}
        - **Asignatura:** ${subject}
        - **Curso:** ${course}
        - **Elemento a evaluar:** ${evaluationElement}
    
        **Tarea:**
        ${taskInstruction}
    
        Devuelve la respuesta estrictamente como un array JSON de strings. Cada string debe ser un criterio conciso y claro. No incluyas nada más en tu respuesta.`;
        
        responseSchema = {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        };

    } else { // criteriaType === 'evaluation'
        const typeDescription = 'Aspectos observables o destrezas generales, junto con una ponderación sugerida para cada uno.';
        const examples = 'Por ejemplo, para un debate podría ser: [{ "name": "Expresar opiniones de forma argumentada", "weight": 40 }, { "name": "Respetar el turno de palabra", "weight": 30 }, { "name": "Uso de vocabulario específico", "weight": 30 }].';
        const taskInstruction = `Genera una lista de 4 o 5 **${typeDescription}** relevantes para este contexto. **Asigna un porcentaje de ponderación (weight) a cada aspecto**. La suma total de todos los porcentajes **debe ser exactamente 100**. No inventes aspectos demasiado genéricos, deben ser evaluables.\n${examples}`;

        prompt = `Eres un asistente experto en el diseño de currículos educativos, especializado en la normativa de la Región de Murcia (Educarm) para la LOMLOE.

        **Contexto:**
        - **Etapa Educativa:** ${stage}
        - **Asignatura:** ${subject}
        - **Curso:** ${course}
        - **Elemento a evaluar:** ${evaluationElement}
    
        **Tarea:**
        ${taskInstruction}
    
        Devuelve la respuesta estrictamente como un array JSON de objetos. Cada objeto debe tener una clave "name" (string) y "weight" (number). La suma de todos los "weight" debe ser 100. No incluyas nada más en tu respuesta.`;

        responseSchema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "El nombre del aspecto a evaluar." },
                    weight: { type: Type.NUMBER, description: "El porcentaje de ponderación para este aspecto." }
                },
                required: ['name', 'weight']
            }
        };
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
                temperature: 0.7,
            }
        });
        const jsonText = response.text.trim();
        const parsedData = JSON.parse(jsonText);

        if (criteriaType === 'specific') {
             if (!Array.isArray(parsedData) || !parsedData.every(item => typeof item === 'string')) {
                throw new Error("Invalid format from AI for suggestions.");
            }
            return parsedData;
        } else {
             if (!Array.isArray(parsedData) || !parsedData.every(item => typeof item === 'object' && typeof item.name === 'string' && typeof item.weight === 'number')) {
                throw new Error("Invalid format from AI for weighted suggestions.");
            }
            return parsedData;
        }

    } catch (error) {
        console.error("Error calling Gemini API for suggestions:", error);
        throw new Error("No se pudieron generar las sugerencias.");
    }
}