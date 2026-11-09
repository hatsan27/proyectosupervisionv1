// Tipos de campo del constructor de formularios (Anexo 11, sección 4).
export const TIPOS_CAMPO = [
  { id: 'texto', label: 'Texto', ayuda: 'Respuesta corta o párrafo' },
  { id: 'numero', label: 'Número', ayuda: 'Cantidad, con mínimo y máximo opcionales' },
  { id: 'fecha', label: 'Fecha', ayuda: 'Selector de fecha' },
  { id: 'opcion', label: 'Opción', ayuda: 'Una opción de una lista' },
  { id: 'tabla', label: 'Tabla', ayuda: 'Varias filas con columnas definidas' },
];
export const TIPO_LABELS = Object.fromEntries(TIPOS_CAMPO.map((t) => [t.id, t.label]));

export const ESTADOS_FORMULARIO = {
  BORRADOR: 'borrador',
  PUBLICADO: 'publicado',
  CERRADO: 'cerrado',
};
export const ESTADO_FORMULARIO_LABELS = { borrador: 'Borrador', publicado: 'Publicado', cerrado: 'Cerrado' };

export const MAX_TEXTO = 1000;
export const MAX_CAMPOS = 50;

const aleatorio = () => Math.random().toString(36).slice(2, 8);
export const nuevoIdCampo = () => `c${aleatorio()}`;

export const campoVacio = (tipo) => ({
  id: nuevoIdCampo(),
  tipo,
  etiqueta: '',
  requerido: true,
  ...(tipo === 'opcion' ? { opciones: ['', ''] } : {}),
  ...(tipo === 'tabla' ? { columnas: ['', ''] } : {}),
});
