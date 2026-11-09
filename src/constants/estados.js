// Estados de una entrega de evidencia (RF-06).
// "pendiente" no se guarda: significa que el plantel aún no tiene documento en "entregas".
export const ESTADOS = Object.freeze({
  PENDIENTE: 'pendiente',
  ENTREGADO: 'entregado',
  CORRECCION: 'correccion',
  ACEPTADO: 'aceptado',
});

export const ESTADO_LABELS = {
  pendiente: 'Pendiente',
  entregado: 'Entregado',
  correccion: 'Corrección',
  aceptado: 'Aceptado',
};

// Estado de la solicitud completa.
export const SOLICITUD_ABIERTA = 'abierta';
export const SOLICITUD_CERRADA = 'cerrada';
