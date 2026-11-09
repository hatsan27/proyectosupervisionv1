// Actividad 12 · Construye el concentrado de un formulario a partir de sus respuestas.
import { formatoFechaHora } from './formatDate';

const fechaCorta = (iso) => {
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
};

const esNumero = (v) => v !== '' && v !== null && v !== undefined && Number.isFinite(Number(v));

const valorTexto = (campo, v) => {
  if (v === null || v === undefined) return '';
  if (campo.tipo === 'fecha') return fechaCorta(v);
  return String(v);
};

/**
 * @returns {{ titulo, generado, general: {headers, rows, totales}, tablas: Array<{titulo, headers, rows, totales}>,
 *            respondieron: string[], pendientes: string[] }}
 */
export const construirConcentrado = (formulario, respuestas, nombres) => {
  const nombre = (id) => nombres[id] ?? id;
  const porPlantel = Object.fromEntries(respuestas.map((r) => [r.plantelId, r]));
  const respondieron = formulario.plantelIds.filter((id) => porPlantel[id]);
  const pendientes = formulario.plantelIds.filter((id) => !porPlantel[id]).map(nombre);

  const simples = formulario.campos.filter((c) => c.tipo !== 'tabla');
  const tablas = formulario.campos.filter((c) => c.tipo === 'tabla');

  // Tabla general: una fila por plantel con los campos simples.
  const general = {
    headers: ['Plantel', ...simples.map((c) => c.etiqueta), 'Fecha de envío'],
    rows: respondieron.map((id) => {
      const r = porPlantel[id];
      return [nombre(id), ...simples.map((c) => valorTexto(c, r.valores?.[c.id])), formatoFechaHora(r.actualizadoEn ?? r.enviadoEn)];
    }),
    totales: null,
  };
  const numericos = simples.map((c) => c.tipo === 'numero');
  if (numericos.some(Boolean) && respondieron.length) {
    general.totales = [
      'Total',
      ...simples.map((c, i) =>
        numericos[i] ? String(respondieron.reduce((s, id) => s + (Number(porPlantel[id].valores?.[c.id]) || 0), 0)) : '',
      ),
      '',
    ];
  }

  // Campos de tipo tabla: una fila por renglón capturado, con el plantel.
  const detalle = tablas.map((c) => {
    const rows = [];
    respondieron.forEach((id) => {
      (porPlantel[id].valores?.[c.id] ?? []).forEach((fila) => {
        rows.push([nombre(id), ...c.columnas.map((_, i) => fila[`c${i}`] ?? '')]);
      });
    });
    // Suma de las columnas cuyos valores son todos numéricos.
    const sumables = c.columnas.map((_, i) => rows.length > 0 && rows.every((r) => r[i + 1] === '' || esNumero(r[i + 1])) && rows.some((r) => esNumero(r[i + 1])));
    const totales = sumables.some(Boolean)
      ? ['Total', ...c.columnas.map((_, i) => (sumables[i] ? String(rows.reduce((s, r) => s + (Number(r[i + 1]) || 0), 0)) : ''))]
      : null;
    return { titulo: c.etiqueta, headers: ['Plantel', ...c.columnas], rows, totales };
  });

  return {
    titulo: formulario.titulo,
    generado: new Date().toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' }),
    general,
    tablas: detalle,
    respondieron: respondieron.map(nombre),
    pendientes,
  };
};
