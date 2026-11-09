// Validaciones del constructor y de las respuestas de formularios.
import { MAX_TEXTO } from '../constants/formularios';

/** Errores de diseño de un campo (para poder publicar). */
export const erroresDeCampo = (c) => {
  if (!c.etiqueta?.trim()) return 'Escriba la pregunta.';
  if (c.tipo === 'opcion' && (c.opciones ?? []).filter((o) => o.trim()).length < 2) return 'Agregue al menos dos opciones.';
  if (c.tipo === 'tabla' && (c.columnas ?? []).filter((o) => o.trim()).length < 1) return 'Agregue al menos una columna.';
  if (c.tipo === 'numero' && c.min !== undefined && c.max !== undefined && c.min !== '' && c.max !== '' && Number(c.min) > Number(c.max))
    return 'El mínimo no puede ser mayor que el máximo.';
  return null;
};

/** Limpia el campo antes de guardarlo (quita opciones o columnas vacías y valores sin usar). */
export const limpiarCampo = (c) => {
  const base = { id: c.id, tipo: c.tipo, etiqueta: c.etiqueta.trim(), requerido: Boolean(c.requerido) };
  if (c.tipo === 'opcion') base.opciones = (c.opciones ?? []).map((o) => o.trim()).filter(Boolean);
  if (c.tipo === 'tabla') base.columnas = (c.columnas ?? []).map((o) => o.trim()).filter(Boolean);
  if (c.tipo === 'numero') {
    if (c.min !== undefined && c.min !== '') base.min = Number(c.min);
    if (c.max !== undefined && c.max !== '') base.max = Number(c.max);
  }
  return base;
};

const vacio = (v) => v === undefined || v === null || (typeof v === 'string' && !v.trim());

/** Valida las respuestas de la directora. Devuelve { campoId: mensaje }. */
export const validarRespuestas = (campos, valores) => {
  const errores = {};
  campos.forEach((c) => {
    const v = valores[c.id];
    if (c.tipo === 'tabla') {
      const filas = (v ?? []).filter((f) => Object.values(f).some((x) => !vacio(x)));
      if (c.requerido && filas.length === 0) errores[c.id] = 'Capture al menos una fila.';
      return;
    }
    if (vacio(v)) {
      if (c.requerido) errores[c.id] = 'Este dato es obligatorio.';
      return;
    }
    if (c.tipo === 'texto' && String(v).length > MAX_TEXTO) errores[c.id] = `Máximo ${MAX_TEXTO} caracteres.`;
    if (c.tipo === 'numero') {
      const n = Number(v);
      if (!Number.isFinite(n)) errores[c.id] = 'Escriba un número válido.';
      else if (c.min !== undefined && n < c.min) errores[c.id] = `El valor mínimo es ${c.min}.`;
      else if (c.max !== undefined && n > c.max) errores[c.id] = `El valor máximo es ${c.max}.`;
    }
    if (c.tipo === 'opcion' && !c.opciones.includes(v)) errores[c.id] = 'Elija una de las opciones.';
  });
  return errores;
};

/** Convierte los valores capturados al formato que se guarda en Firestore. */
export const normalizarRespuestas = (campos, valores) => {
  const salida = {};
  campos.forEach((c) => {
    const v = valores[c.id];
    if (c.tipo === 'tabla') {
      salida[c.id] = (v ?? [])
        .filter((f) => Object.values(f).some((x) => !vacio(x)))
        .map((f) => Object.fromEntries(c.columnas.map((_, i) => [`c${i}`, String(f[`c${i}`] ?? '').trim()])));
    } else if (c.tipo === 'numero') {
      salida[c.id] = vacio(v) ? null : Number(v);
    } else {
      salida[c.id] = vacio(v) ? '' : String(v).trim();
    }
  });
  return salida;
};
