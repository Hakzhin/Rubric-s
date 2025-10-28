export const translations = {
  es: {
    // App.tsx
    error_generating_rubric: 'Hubo un error al generar la rúbrica. Por favor, inténtalo de nuevo.',
    generating_rubric_please_wait: 'Generando rúbrica, por favor espera...',
    start_designing_rubric: 'Comienza a diseñar tu rúbrica',
    complete_form_for_rubric: 'Completa el formulario de arriba para generar una rúbrica de evaluación personalizada con IA.',
    developed_by: 'Desarrollado con IA por Rubric@s EBP',

    // Header.tsx
    header_subtitle: 'Tu asistente inteligente para la creación de rúbricas de evaluación',
    
    // LanguageSelector.tsx
    spanish: 'Español',
    english: 'English',
    french: 'Français',

    // RubricForm.tsx
    rubric_config: 'Configuración de la Rúbrica',
    reset_form_title: 'Reiniciar formulario y empezar de nuevo',
    reset: 'Reiniciar',
    educational_stage: 'Etapa Educativa',
    select_stage: 'Selecciona una etapa...',
    subject: 'Asignatura',
    select_subject: 'Selecciona una asignatura...',
    course: 'Curso',
    select_course: 'Selecciona un curso...',
    element_to_evaluate: 'Elemento a evaluar',
    element_to_evaluate_placeholder: 'Ej: un cuaderno, un debate, la participación en clase...',
    evaluation_criteria_lomloe: 'Criterios de Evaluación (Currículo LOMLOE)',
    add_criteria_placeholder: 'Añadir criterio con numeración (ej: 1.1)...',
    remove_item: 'Quitar',
    add: 'Añadir',
    suggest_with_ai: 'Sugerir con IA',
    suggesting: 'Sugiriendo...',
    specific_aspects_to_evaluate: 'Aspectos Específicos a Evaluar y Ponderación',
    add_observable_aspect_placeholder: 'Añadir aspecto observable (ej: Limpieza)...',
    weighted_total: 'Total ponderado',
    performance_levels_customizable: 'Niveles de desempeño (personalizables)',
    add_new_level_placeholder: 'Añadir nuevo nivel...',
    generate_rubric: 'Generar Rúbrica',
    generating: 'Generando...',
    weighting_must_be_100: 'La ponderación total debe ser exactamente 100% para poder generar la rúbrica.',
    reset_form_modal_title: '¿Reiniciar formulario?',
    reset_form_modal_text: 'Se perderán todos los datos del formulario y la rúbrica generada. Esta acción no se puede deshacer.',
    cancel: 'Cancelar',
    yes_reset: 'Sí, reiniciar',

    // RubricDisplay.tsx
    save_changes: 'Guardar cambios',
    edit_rubric: 'Editar rúbrica',
    save: 'Guardar',
    edit: 'Editar',
    export_to_excel: 'Exportar a Excel (.xlsx)',
    excel: 'Excel',
    print_or_pdf_title: 'Abrir en una nueva pestaña para imprimir o guardar como PDF',
    print_pdf: 'Imprimir / PDF',
    evaluation_item: 'Ítem de Evaluación',
    weight: 'Peso',
    
    // SavedRubrics.tsx
    saved_rubrics: 'Rúbricas guardadas',
    last_10_saved: 'Últimas 10 rúbricas guardadas',
    saved_at: 'Guardado',
    delete: 'Eliminar',
    delete_confirmation: '¿Eliminar esta rúbrica guardada?',
    no_saved_rubrics: 'No hay rúbricas guardadas.',
    
    // geminiService.ts
    error_api_key_not_set: 'La variable de entorno API_KEY o VITE_GEMINI_API_KEY no está configurada. Por favor, asegúrate de que una de ellas esté disponible.',
    error_invalid_ai_response: 'Formato de respuesta de la IA inválido.',
    error_generating_rubric_from_service: 'No se pudo generar la rúbrica desde el servicio de IA.',
    error_getting_suggestions: 'Error al obtener sugerencias.',
    error_generating_suggestions: 'No se pudieron generar las sugerencias.',

    // FIX: Add missing translation keys for the GeminiChat component.
    gemini_chat_title: 'Chatea con Gemini',
    gemini_chat_description: 'Haz preguntas sobre la rúbrica o pide ayuda.',
    gemini_chat_thinking: 'Gemini está pensando...',
    gemini_chat_placeholder: 'Escribe tu pregunta aquí...',
    gemini_chat_error: 'Hubo un error al contactar a Gemini.',
  },
  en: {
    // App.tsx
    error_generating_rubric: 'There was an error generating the rubric. Please try again.',
    generating_rubric_please_wait: 'Generating rubric, please wait...',
    start_designing_rubric: 'Start Designing Your Rubric',
    complete_form_for_rubric: 'Complete the form above to generate a custom evaluation rubric with AI.',
    developed_by: 'Developed with AI by Rubric@s EBP',
    
    // Header.tsx
    header_subtitle: 'Your intelligent assistant for creating evaluation rubrics',

    // LanguageSelector.tsx
    spanish: 'Español',
    english: 'English',
    french: 'Français',

    // RubricForm.tsx
    rubric_config: 'Rubric Configuration',
    reset_form_title: 'Reset form and start over',
    reset: 'Reset',
    educational_stage: 'Educational Stage',
    select_stage: 'Select a stage...',
    subject: 'Subject',
    select_subject: 'Select a subject...',
    course: 'Course',
    select_course: 'Select a course...',
    element_to_evaluate: 'Element to Evaluate',
    element_to_evaluate_placeholder: 'e.g., a notebook, a debate, class participation...',
    evaluation_criteria_lomloe: 'Evaluation Criteria (LOMLOE Curriculum)',
    add_criteria_placeholder: 'Add criterion with numbering (e.g., 1.1)...',
    remove_item: 'Remove',
    add: 'Add',
    suggest_with_ai: 'Suggest with AI',
    suggesting: 'Suggesting...',
    specific_aspects_to_evaluate: 'Specific Aspects to Evaluate and Weighting',
    add_observable_aspect_placeholder: 'Add observable aspect (e.g., Cleanliness)...',
    weighted_total: 'Weighted total',
    performance_levels_customizable: 'Performance Levels (customizable)',
    add_new_level_placeholder: 'Add new level...',
    generate_rubric: 'Generate Rubric',
    generating: 'Generating...',
    weighting_must_be_100: 'The total weighting must be exactly 100% to generate the rubric.',
    reset_form_modal_title: 'Reset form?',
    reset_form_modal_text: 'All data in the form and the generated rubric will be lost. This action cannot be undone.',
    cancel: 'Cancel',
    yes_reset: 'Yes, reset',

    // RubricDisplay.tsx
    save_changes: 'Save changes',
    edit_rubric: 'Edit rubric',
    save: 'Save',
    edit: 'Edit',
    export_to_excel: 'Export to Excel (.xlsx)',
    excel: 'Excel',
    print_or_pdf_title: 'Open in a new tab to print or save as PDF',
    print_pdf: 'Print / PDF',
    evaluation_item: 'Evaluation Item',
    weight: 'Weight',

    // SavedRubrics.tsx
    saved_rubrics: 'Saved Rubrics',
    last_10_saved: 'Last 10 saved rubrics',
    saved_at: 'Saved',
    delete: 'Delete',
    delete_confirmation: 'Delete this saved rubric?',
    no_saved_rubrics: 'No saved rubrics.',
    
    // geminiService.ts
    error_api_key_not_set: 'The API_KEY or VITE_GEMINI_API_KEY environment variable is not set. Please make sure one of them is available.',
    error_invalid_ai_response: 'Invalid response format from AI.',
    error_generating_rubric_from_service: 'Could not generate the rubric from the AI service.',
    error_getting_suggestions: 'Error getting suggestions.',
    error_generating_suggestions: 'Could not generate suggestions.',

    // FIX: Add missing translation keys for the GeminiChat component.
    gemini_chat_title: 'Chat with Gemini',
    gemini_chat_description: 'Ask questions about the rubric or for help.',
    gemini_chat_thinking: 'Gemini is thinking...',
    gemini_chat_placeholder: 'Type your question here...',
    gemini_chat_error: 'There was an error contacting Gemini.',
  },
  fr: {
    // App.tsx
    error_generating_rubric: 'Une erreur est survenue lors de la génération de la grille. Veuillez réessayer.',
    generating_rubric_please_wait: 'Génération de la grille en cours, veuillez patienter...',
    start_designing_rubric: 'Commencez à concevoir votre grille',
    complete_form_for_rubric: "Remplissez le formulaire ci-dessus pour générer une grille d'évaluation personnalisée avec l'IA.",
    developed_by: 'Développé avec l\'IA par Rubric@s EBP',
    
    // Header.tsx
    header_subtitle: 'Votre assistant intelligent pour la création de grilles d\'évaluation',

    // LanguageSelector.tsx
    spanish: 'Español',
    english: 'English',
    french: 'Français',

    // RubricForm.tsx
    rubric_config: 'Configuration de la Grille',
    reset_form_title: 'Réinitialiser le formulaire et recommencer',
    reset: 'Réinitialiser',
    educational_stage: 'Niveau d\'enseignement',
    select_stage: 'Sélectionnez un niveau...',
    subject: 'Matière',
    select_subject: 'Sélectionnez une matière...',
    course: 'Classe',
    select_course: 'Sélectionnez une classe...',
    element_to_evaluate: 'Élément à évaluer',
    element_to_evaluate_placeholder: 'Ex: un cahier, un débat, la participation en classe...',
    evaluation_criteria_lomloe: 'Critères d\'évaluation (Programme LOMLOE)',
    add_criteria_placeholder: 'Ajouter un critère avec numérotation (ex: 1.1)...',
    remove_item: 'Retirer',
    add: 'Ajouter',
    suggest_with_ai: 'Suggérer avec l\'IA',
    suggesting: 'Suggestion...',
    specific_aspects_to_evaluate: 'Aspects Spécifiques à Évaluer et Pondération',
    add_observable_aspect_placeholder: 'Ajouter un aspect observable (ex: Propreté)...',
    weighted_total: 'Total pondéré',
    performance_levels_customizable: 'Nivaux de performance (personnalisables)',
    add_new_level_placeholder: 'Ajouter un nouveau niveau...',
    generate_rubric: 'Générer la Grille',
    generating: 'Génération en cours...',
    weighting_must_be_100: 'La pondération totale doit être exactement de 100% pour pouvoir générer la grille.',
    reset_form_modal_title: 'Réinitialiser le formulaire ?',
    reset_form_modal_text: 'Toutes les données du formulaire et la grille générée seront perdues. Cette action est irréversible.',
    cancel: 'Annuler',
    yes_reset: 'Oui, réinitialiser',

    // RubricDisplay.tsx
    save_changes: 'Enregistrer les modifications',
    edit_rubric: 'Modifier la grille',
    save: 'Enregistrer',
    edit: 'Modifier',
    export_to_excel: 'Exporter vers Excel (.xlsx)',
    excel: 'Excel',
    print_or_pdf_title: 'Ouvrir dans un nouvel onglet pour imprimer ou enregistrer en PDF',
    print_pdf: 'Imprimer / PDF',
    evaluation_item: 'Item d\'Évaluation',
    weight: 'Poids',

    // SavedRubrics.tsx
    saved_rubrics: 'Grilles enregistrées',
    last_10_saved: '10 dernières grilles enregistrées',
    saved_at: 'Enregistré le',
    delete: 'Supprimer',
    delete_confirmation: 'Supprimer cette grille enregistrée ?',
    no_saved_rubrics: 'Aucune grille enregistrée.',
    
    // geminiService.ts
    error_api_key_not_set: "La variable d'environnement API_KEY ou VITE_GEMINI_API_KEY n'est pas configurée. Veuillez vous assurer que l'une d'entre elles est disponible.",
    error_invalid_ai_response: "Format de réponse de l'IA invalide.",
    error_generating_rubric_from_service: "Impossible de générer la grille depuis le service d'IA.",
    error_getting_suggestions: 'Erreur lors de l\'obtention des suggestions.',
    error_generating_suggestions: 'Impossible de générer les suggestions.',
    
    // FIX: Add missing translation keys for the GeminiChat component.
    gemini_chat_title: 'Discuter avec Gemini',
    gemini_chat_description: 'Posez des questions sur la grille ou demandez de l\'aide.',
    gemini_chat_thinking: 'Gemini réfléchit...',
    gemini_chat_placeholder: 'Tapez votre question ici...',
    gemini_chat_error: 'Une erreur est survenue en contactant Gemini.',
  }
};

export type TranslationKey = keyof typeof translations.es;