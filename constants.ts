export const ETAPAS_EDUCATIVAS = [
  { value: 'infantil', label: 'Educación Infantil' },
  { value: 'primaria', label: 'Educación Primaria' },
  { value: 'secundaria', label: 'Educación Secundaria' },
];

export const CURSOS_POR_ETAPA: Record<string, { value: string; label: string }[]> = {
  infantil: [
    { value: '0-3', label: 'Primer ciclo (0-3 años)' },
    { value: '3-6', label: 'Segundo ciclo (3-6 años)' },
  ],
  primaria: [
    { value: '1', label: '1º de Primaria' },
    { value: '2', label: '2º de Primaria' },
    { value: '3', label: '3º de Primaria' },
    { value: '4', label: '4º de Primaria' },
    { value: '5', label: '5º de Primaria' },
    { value: '6', label: '6º de Primaria' },
  ],
  secundaria: [
    { value: '1', label: '1º de ESO' },
    { value: '2', label: '2º de ESO' },
    { value: '3', label: '3º de ESO' },
    { value: '4', label: '4º de ESO' },
  ],
};

export const ASIGNATURAS_POR_ETAPA: Record<string, { value: string; label: string }[]> = {
    infantil: [
      { value: 'crecimiento-armonia', label: 'Crecimiento en Armonía' },
      { value: 'descubrimiento-entorno', label: 'Descubrimiento y Exploración del Entorno' },
      { value: 'comunicacion-representacion', label: 'Comunicación y Representación de la Realidad' },
    ],
    primaria: [
      { value: 'lengua', label: 'Lengua Castellana y Literatura' },
      { value: 'matematicas', label: 'Matemáticas' },
      { value: 'conocimiento-medio', label: 'Conocimiento del Medio Natural, Social y Cultural' },
      { value: 'ingles', label: 'Lengua Extranjera: Inglés' },
      { value: 'educacion-fisica', label: 'Educación Física' },
      { value: 'educacion-artistica', label: 'Educación Artística (Plástica y Música)' },
      { value: 'religion', label: 'Religión' },
      { value: 'valores', label: 'Valores Cívicos y Éticos' },
    ],
    secundaria: [
      { value: 'lengua', label: 'Lengua Castellana y Literatura' },
      { value: 'matematicas', label: 'Matemáticas' },
      { value: 'ingles', label: 'Lengua Extranjera: Inglés' },
      { value: 'geografia-historia', label: 'Geografía e Historia' },
      { value: 'biologia-geologia', label: 'Biología y Geología' },
      { value: 'fisica-quimica', label: 'Física y Química' },
      { value: 'tecnologia', label: 'Tecnología y Digitalización' },
      { value: 'educacion-fisica', label: 'Educación Física' },
      { value: 'musica', label: 'Música' },
      { value: 'plastica', label: 'Educación Plástica, Visual y Audiovisual' },
      { value: 'frances', label: 'Lengua Extranjera: Francés' },
      { value: 'latin', label: 'Latín' },
      { value: 'cultura-clasica', label: 'Cultura Clásica' },
      { value: 'economia', label: 'Economía y Emprendimiento' },
      { value: 'religion', label: 'Religión' },
    ],
  };