import { GoogleGenAI, Type } from "@google/genai";
import type { FormData, Rubric, RubricItem, WeightedCriterion } from '../types';
import { ASIGNATURAS_POR_ETAPA } from '../constants';
import { CURRICULUM_DATA } from '../curriculumData';

// Lazily initialize the AI client to avoid throwing an error on module load.
let ai: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
    if (!ai) {
        // Vite-based apps use import.meta.env
        const viteApiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;

        // The preview/dev environment might use process.env
        // Check for existence of 'process' to avoid ReferenceError in browser
        const processApiKey = typeof process !== 'undefined' ? process.env?.API_KEY : undefined;

        const apiKey = viteApiKey || processApiKey;

        if (!apiKey) {
            console.error("API_KEY or VITE_GEMINI_API_KEY is not set.");
            throw new Error("error_api_key_not_set");
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
}

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
    const aiClient = getAiClient();
    const response = await aiClient.models.generateContent({
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
        throw new Error("error_invalid_ai_response");
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
    if (error instanceof Error && error.message.includes('API_KEY')) {
        throw new Error("error_api_key_not_set");
    }
    if (error instanceof Error) {
        throw error; // Re-throw the original error which might be a translation key
    }
    throw new Error("error_generating_rubric_from_service");
  }
}

export async function generateCriteriaSuggestions(
  context: Pick<FormData, 'stage' | 'course' | 'subject' | 'evaluationElement'>,
  criteriaType: 'specific' | 'evaluation'
): Promise<string[] | WeightedCriterion[]> {
    const { stage, course, subject, evaluationElement } = context;

    let prompt: string;
    let config: any;

    if (criteriaType === 'specific') {
        // Use local curriculum data for Secondary Education as requested.
        if (stage === 'Educación Secundaria') {
            const subjectEntry = ASIGNATURAS_POR_ETAPA.secundaria.find(s => s.label === subject);
            const subjectValue = subjectEntry ? subjectEntry.value : null;

            const courseNumMatch = course.match(/\d+/);
            const courseNumber = courseNumMatch ? parseInt(courseNumMatch[0], 10) : 0;
            
            // Type guard to ensure we can index CURRICULUM_DATA.secundaria
            // FIX: Using an intersection with `string` on the keyof type ensures that the type predicate is valid,
            // as `keyof` on a string-indexed type can return `string | number`.
            const isKnownSubject = (s: string | null): s is (keyof typeof CURRICULUM_DATA.secundaria & string) => {
              return s !== null && s in CURRICULUM_DATA.secundaria;
            }

            if (isKnownSubject(subjectValue) && courseNumber > 0) {
                const subjectData = CURRICULUM_DATA.secundaria[subjectValue];
                const availableGradeKeys = Object.keys(subjectData);

                const gradeKey = availableGradeKeys.find(key => {
                    const parts = key.split('-').map(Number);
                    if (parts.length === 1) return courseNumber === parts[0];
                    if (parts.length === 2) return courseNumber >= parts[0] && courseNumber <= parts[1];
                    return false;
                });

                if (gradeKey && subjectData[gradeKey]) {
                    const relevantCriteria = subjectData[gradeKey].map(c => `${c.criterio} ${c.descripcion}`);
                    const criteriaList = relevantCriteria.join('\n - ');

                    prompt = `Eres un asistente experto en el diseño de currículos educativos, especializado en la normativa LOMLOE de España.

                    **Contexto:**
                    - **Etapa Educativa:** ${stage}
                    - **Asignatura:** ${subject}
                    - **Curso:** ${course}
                    - **Elemento a evaluar:** ${evaluationElement}

                    **Tarea:**
                    A partir de la siguiente lista de Criterios de Evaluación OFICIALES para la asignatura y curso indicados, selecciona los 4 o 5 criterios **MÁS RELEVANTES** para evaluar un "${evaluationElement}".

                    **Lista de Criterios de Evaluación Disponibles:**
                    - ${criteriaList}

                    **IMPORTANTE:**
                    1. Tu respuesta DEBE ser únicamente un array JSON válido que contenga los textos completos de los criterios que seleccionaste.
                    2. No incluyas texto introductorio, explicaciones, ni \`\`\`json markdown. Solo el array JSON.
                    3. Asegúrate de devolver el texto completo del criterio, incluyendo su numeración.

                    Ejemplo de respuesta válida:
                    ["1.1 Analizar conceptos y procesos biológicos...", "2.3 Valorar la contribución de la ciencia..."]`;
                    
                    const responseSchema = {
                        type: Type.ARRAY,
                        items: {
                            type: Type.STRING,
                            description: "El texto completo de un criterio de evaluación seleccionado."
                        }
                    };

                    config = {
                      responseMimeType: 'application/json',
                      responseSchema: responseSchema,
                      temperature: 0.2,
                    };
                }
            }
        }
        
        // Fallback to Google Search if local data isn't available or for other educational stages
        if (!config) {
            prompt = `Eres un asistente experto en el diseño de currículos educativos, especializado en la normativa LOMLOE de España.

            **Contexto:**
            - **Etapa Educativa:** ${stage}
            - **Asignatura:** ${subject}
            - **Curso:** ${course}
            - **Elemento a evaluar:** ${evaluationElement}

            **Tarea:**
            Tu tarea es buscar en la web, utilizando fuentes oficiales del gobierno de España (como educagob.educacionfpydeportes.gob.es o boletines oficiales), los **Criterios de Evaluación** oficiales del currículo LOMLOE para la asignatura y etapa especificadas.
            Una vez encontrados, selecciona los 4 o 5 criterios más relevantes para evaluar un "${evaluationElement}".

            **IMPORTANTE:** Tu respuesta DEBE ser únicamente un array JSON válido que contenga strings. No incluyas texto introductorio, explicaciones, ni \`\`\`json markdown. Solo el array.
            Ejemplo de respuesta válida:
            ["Criterio 1.1 completo y oficial.", "Criterio 2.3 completo y oficial."]`;
            
            config = {
              tools: [{googleSearch: {}}],
              temperature: 0.5,
            };
        }
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

        const responseSchema = {
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

        config = {
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.7,
        };
    }

    try {
        const aiClient = getAiClient();
        const response = await aiClient.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: config,
        });
        
        let jsonText = response.text.trim();
        
        // This regex is a fallback for when the API uses googleSearch and might include markdown.
        // It should not be necessary when responseSchema is used with local data.
        if (criteriaType === 'specific' && config.tools?.some(t => 'googleSearch' in t)) {
            const jsonMatch = jsonText.match(/(\[[\s\S]*\])/);
            if (jsonMatch && jsonMatch[1]) {
                jsonText = jsonMatch[1];
            } else {
                console.error("AI response did not contain a valid JSON array for 'specific' criteria.");
                throw new Error("error_invalid_ai_response");
            }
        }

        const parsedData = JSON.parse(jsonText);

        if (criteriaType === 'specific') {
             if (!Array.isArray(parsedData) || !parsedData.every(item => typeof item === 'string')) {
                throw new Error("error_invalid_ai_response");
            }
            return parsedData;
        } else {
             if (!Array.isArray(parsedData) || !parsedData.every(item => typeof item === 'object' && typeof item.name === 'string' && typeof item.weight === 'number')) {
                throw new Error("error_invalid_ai_response");
            }
            return parsedData;
        }

    } catch (error) {
        console.error("Error calling Gemini API for suggestions:", error);
        if (error instanceof Error && error.message.includes('API_KEY')) {
            throw new Error("error_api_key_not_set");
        }
        if (error instanceof Error && error.message.includes('invalid_ai_response')) {
             throw error;
        }
        throw new Error("error_generating_suggestions");
    }
}

export async function generateChatResponse(prompt: string): Promise<string> {
    try {
        const aiClient = getAiClient();
        const response = await aiClient.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: 'You are an expert pedagogical assistant. Answer questions about evaluation rubrics concisely and helpfully.',
                temperature: 0.7,
            },
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error calling Gemini API for chat:", error);
        if (error instanceof Error && error.message.includes('API_KEY')) {
            throw new Error("error_api_key_not_set");
        }
        throw new Error("gemini_chat_error");
    }
}