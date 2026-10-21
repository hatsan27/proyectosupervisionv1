// Perfiles de usuario definidos en el Anexo 2 (RF-02).
export const ROLES = Object.freeze({
  SUPERVISORA: 'supervisora',
  ADMINISTRATIVA: 'administrativa',
  DIRECTORA: 'directora',
});

export const ROLE_LABELS = {
  [ROLES.SUPERVISORA]: 'Supervisora',
  [ROLES.ADMINISTRATIVA]: 'Personal administrativo',
  [ROLES.DIRECTORA]: 'Directora o encargada',
};

export const ROLES_VALIDOS = Object.values(ROLES);

// Valor usado en el campo "destinatarios" para avisos generales.
export const DESTINO_TODOS = 'todos';
