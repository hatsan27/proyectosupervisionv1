// Respuestas de los planteles (RF-08, RF-09). ID: {formularioId}_{plantelId}.
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ROLES } from '../constants/roles';

const respuestasRef = collection(db, 'respuestas');
const mapear = (snap) => ({ id: snap.id, ...snap.data() });

export const idRespuesta = (formularioId, plantelId) => `${formularioId}_${plantelId}`;

/** Respuesta del plantel de la directora (o null si aún no responde). */
export const obtenerMiRespuesta = async (formularioId, perfil) => {
  const snap = await getDoc(doc(db, 'respuestas', idRespuesta(formularioId, perfil.plantelId)));
  return snap.exists() ? mapear(snap) : null;
};

/** Respuestas de un formulario (concentrado, solo supervisión). */
export const obtenerRespuestasDeFormulario = async (formularioId) => {
  const snap = await getDocs(query(respuestasRef, where('formularioId', '==', formularioId)));
  return snap.docs.map(mapear);
};

/** Respuestas visibles: las del plantel (directora) o todas (supervisión). */
export const obtenerRespuestas = async (perfil) => {
  const q = perfil.rol === ROLES.DIRECTORA ? query(respuestasRef, where('plantelId', '==', perfil.plantelId)) : respuestasRef;
  const snap = await getDocs(q);
  return snap.docs.map(mapear);
};

/** Guarda la respuesta: la crea la primera vez y la actualiza después. */
export const guardarRespuesta = async (formularioId, valores, perfil, existente) => {
  const ref = doc(db, 'respuestas', idRespuesta(formularioId, perfil.plantelId));
  if (existente) {
    await updateDoc(ref, { valores, enviadoPor: perfil.uid, actualizadoEn: serverTimestamp() });
  } else {
    await setDoc(ref, {
      formularioId,
      plantelId: perfil.plantelId,
      valores,
      enviadoPor: perfil.uid,
      enviadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
    });
  }
};
