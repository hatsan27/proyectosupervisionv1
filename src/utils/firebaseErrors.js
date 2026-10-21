// Traduce los códigos de error de Firebase a mensajes claros para las usuarias.
const MENSAJES = {
  'auth/invalid-credential': 'El correo o la contraseña no son correctos.',
  'auth/wrong-password': 'El correo o la contraseña no son correctos.',
  'auth/user-not-found': 'El correo o la contraseña no son correctos.',
  'auth/invalid-email': 'El correo electrónico no tiene un formato válido.',
  'auth/user-disabled': 'Esta cuenta fue deshabilitada. Comuníquese con la Supervisión.',
  'auth/too-many-requests': 'Demasiados intentos. Espere unos minutos e intente de nuevo.',
  'auth/network-request-failed': 'No hay conexión a internet. Revise su red e intente de nuevo.',
  'permission-denied': 'No tiene permiso para realizar esta operación.',
  unavailable: 'El servicio no está disponible en este momento. Intente más tarde.',
  'perfil/no-encontrado': 'Su cuenta no tiene un perfil autorizado en la plataforma.',
  'perfil/inactivo': 'Su cuenta está inactiva. Comuníquese con la Supervisión.',
  'perfil/rol-invalido': 'Su cuenta no tiene un rol válido asignado.',
};

export const mensajeDeError = (error) => {
  const codigo = error?.code ?? '';
  return MENSAJES[codigo] ?? 'Ocurrió un problema. Intente de nuevo.';
};
