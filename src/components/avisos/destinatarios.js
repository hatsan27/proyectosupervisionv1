import { DESTINO_TODOS } from '../../constants/roles';

// Texto legible para el campo "destinatarios" de un aviso.
export const textoDestinatarios = (destinatarios = [], nombres = {}) => {
  if (destinatarios.includes(DESTINO_TODOS)) return 'Todos los planteles';
  if (destinatarios.length === 1) return nombres[destinatarios[0]] ?? destinatarios[0];
  return `${destinatarios.length} planteles`;
};
