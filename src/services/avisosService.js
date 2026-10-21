// Módulo de avisos (RF-03 y RF-10): consulta y publicación en la colección "avisos".
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { DESTINO_TODOS, ROLES } from '../constants/roles';

const avisosRef = collection(db, 'avisos');

const mapear = (snap) => ({ id: snap.id, ...snap.data() });

const porFechaDesc = (a, b) =>
  (b.publicadoEn?.toMillis?.() ?? Date.now()) - (a.publicadoEn?.toMillis?.() ?? Date.now());

/**
 * Devuelve los avisos que el perfil puede consultar.
 * La directora solo solicita avisos generales o dirigidos a su plantel;
 * las reglas de Firestore rechazan cualquier consulta más amplia.
 */
export const obtenerAvisos = async (perfil) => {
  if (perfil.rol === ROLES.DIRECTORA) {
    const q = query(
      avisosRef,
      where('destinatarios', 'array-contains-any', [DESTINO_TODOS, perfil.plantelId]),
    );
    const snap = await getDocs(q);
    // Se ordena en el navegador para no requerir un índice compuesto.
    return snap.docs.map(mapear).sort(porFechaDesc);
  }

  const snap = await getDocs(query(avisosRef, orderBy('publicadoEn', 'desc')));
  return snap.docs.map(mapear);
};

export const obtenerAviso = async (avisoId) => {
  const snap = await getDoc(doc(db, 'avisos', avisoId));
  return snap.exists() ? mapear(snap) : null;
};

/**
 * Publica un aviso. Solo la supervisora tiene permiso (validado por las reglas).
 * @param {{titulo:string, contenido:string, destinatarios:string[]}} datos
 */
export const publicarAviso = async ({ titulo, contenido, destinatarios }, perfil) => {
  const ref = await addDoc(avisosRef, {
    titulo: titulo.trim(),
    contenido: contenido.trim(),
    destinatarios,
    creadoPor: perfil.uid,
    autorNombre: perfil.nombre ?? '',
    publicadoEn: serverTimestamp(),
  });
  return ref.id;
};
