// Formularios (RF-08): diseño, publicación, cierre y consulta.
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { ROLES } from '../constants/roles';
import { ESTADOS_FORMULARIO } from '../constants/formularios';

const formulariosRef = collection(db, 'formularios');
const mapear = (snap) => ({ id: snap.id, ...snap.data() });

const aTimestamp = (fechaISO) => {
  const [a, m, d] = fechaISO.split('-').map(Number);
  return Timestamp.fromDate(new Date(a, m - 1, d, 23, 59, 59));
};

/** La directora solo consulta formularios publicados o cerrados dirigidos a su plantel. */
export const obtenerFormularios = async (perfil) => {
  if (perfil.rol === ROLES.DIRECTORA) {
    const q = query(
      formulariosRef,
      where('plantelIds', 'array-contains', perfil.plantelId),
      where('estado', 'in', [ESTADOS_FORMULARIO.PUBLICADO, ESTADOS_FORMULARIO.CERRADO]),
    );
    const snap = await getDocs(q);
    return snap.docs.map(mapear).sort((a, b) => a.fechaLimite.toMillis() - b.fechaLimite.toMillis());
  }
  const snap = await getDocs(formulariosRef);
  return snap.docs.map(mapear).sort((a, b) => (b.creadoEn?.toMillis?.() ?? 0) - (a.creadoEn?.toMillis?.() ?? 0));
};

export const obtenerFormulario = async (formularioId) => {
  const snap = await getDoc(doc(db, 'formularios', formularioId));
  return snap.exists() ? mapear(snap) : null;
};

/**
 * Guarda un formulario. Si `publicar` es verdadero, queda publicado para los planteles.
 * @returns {Promise<string>} ID del formulario
 */
export const guardarFormulario = async ({ id, titulo, descripcion, campos, plantelIds, fechaLimite }, perfil, publicar) => {
  const datos = {
    titulo: titulo.trim(),
    descripcion: descripcion.trim(),
    campos,
    plantelIds,
    fechaLimite: aTimestamp(fechaLimite),
  };
  let formularioId = id;
  if (!formularioId) {
    const ref = await addDoc(formulariosRef, {
      ...datos,
      estado: ESTADOS_FORMULARIO.BORRADOR,
      creadoPor: perfil.uid,
      autorNombre: perfil.nombre ?? '',
      creadoEn: serverTimestamp(),
    });
    formularioId = ref.id;
  } else {
    await updateDoc(doc(db, 'formularios', formularioId), datos);
  }
  if (publicar) {
    await updateDoc(doc(db, 'formularios', formularioId), {
      estado: ESTADOS_FORMULARIO.PUBLICADO,
      publicadoEn: serverTimestamp(),
    });
  }
  return formularioId;
};

/** Cerrar (ya no recibe respuestas) o reabrir un formulario publicado. */
export const cambiarEstadoFormulario = (formularioId, estado) =>
  updateDoc(doc(db, 'formularios', formularioId), { estado });

export const eliminarFormulario = (formularioId) => deleteDoc(doc(db, 'formularios', formularioId));
