// Convierte un Timestamp de Firestore (o Date) a texto legible en español.
const toDate = (valor) => {
  if (!valor) return null;
  if (typeof valor.toDate === 'function') return valor.toDate();
  if (valor instanceof Date) return valor;
  return null;
};

export const formatoFecha = (valor) => {
  const fecha = toDate(valor);
  if (!fecha) return 'Registrando…';
  return fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatoFechaHora = (valor) => {
  const fecha = toDate(valor);
  if (!fecha) return 'Registrando…';
  return fecha.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const esDelMesActual = (valor) => {
  const fecha = toDate(valor);
  if (!fecha) return true;
  const hoy = new Date();
  return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
};
