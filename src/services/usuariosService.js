// Consulta del perfil asociado a la cuenta autenticada (colección "usuarios", RF-02).
// El ID de cada documento es el UID que asigna Firebase Authentication.
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ROLES, ROLES_VALIDOS } from '../constants/roles';

const errorPerfil = (code) => Object.assign(new Error(code), { code });

export const obtenerPerfil = async (uid) => {
  const snap = await getDoc(doc(db, 'usuarios', uid));

  if (!snap.exists()) throw errorPerfil('perfil/no-encontrado');

  const perfil = { uid, ...snap.data() };

  if (perfil.activo !== true) throw errorPerfil('perfil/inactivo');
  if (!ROLES_VALIDOS.includes(perfil.rol)) throw errorPerfil('perfil/rol-invalido');
  if (perfil.rol === ROLES.DIRECTORA && !perfil.plantelId) throw errorPerfil('perfil/rol-invalido');

  return perfil;
};
