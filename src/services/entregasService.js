// Entregas de evidencia (RF-05, RF-06): envío por la directora y revisión por la supervisión.
// Cada entrega se identifica como {solicitudId}_{plantelId}: un plantel, una entrega por solicitud.
import { collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ESTADOS } from '../constants/estados';
import { ROLES } from '../constants/roles';
import { eliminarArchivo, subirEvidencia } from './storageService';

const entregasRef = collection(db, 'entregas');
const mapear = (snap) => ({ id: snap.id, ...snap.data() });

export const idEntrega = (solicitudId, plantelId) => `${solicitudId}_${plantelId}`;

/** Entregas de una solicitud. La directora solo recibe la de su plantel. */
export const obtenerEntregasDeSolicitud = async (solicitudId, perfil) => {
  const filtros = [where('solicitudId', '==', solicitudId)];
  if (perfil.rol === ROLES.DIRECTORA) filtros.push(where('plantelId', '==', perfil.plantelId));
  const snap = await getDocs(query(entregasRef, ...filtros));
  return snap.docs.map(mapear);
};

/** Todas las entregas visibles: las del plantel (directora) o las de la zona (supervisión). */
export const obtenerEntregas = async (perfil) => {
  const q =
    perfil.rol === ROLES.DIRECTORA ? query(entregasRef, where('plantelId', '==', perfil.plantelId)) : entregasRef;
  const snap = await getDocs(q);
  return snap.docs.map(mapear);
};

/**
 * Sube el archivo y registra (o reemplaza) la entrega del plantel.
 * Si ya existía una entrega anterior, su archivo se elimina después de guardar la nueva.
 */
export const enviarEvidencia = async ({ solicitudId, perfil, archivo, entregaAnterior, onProgreso }) => {
  const datosArchivo = await subirEvidencia({ solicitudId, plantelId: perfil.plantelId, archivo, onProgreso });

  try {
    await setDoc(doc(db, 'entregas', idEntrega(solicitudId, perfil.plantelId)), {
      solicitudId,
      plantelId: perfil.plantelId,
      estado: ESTADOS.ENTREGADO,
      archivo: datosArchivo,
      enviadoPor: perfil.uid,
      enviadoEn: serverTimestamp(),
    });
  } catch (e) {
    await eliminarArchivo(datosArchivo.ruta); // no dejar archivos huérfanos
    throw e;
  }

  if (entregaAnterior?.archivo?.ruta) await eliminarArchivo(entregaAnterior.archivo.ruta);
};

/** Revisión por la supervisora o el personal administrativo: aceptar o pedir corrección. */
export const revisarEntrega = (entregaId, estado, comentario, perfil) =>
  updateDoc(doc(db, 'entregas', entregaId), {
    estado,
    comentarioRevision: comentario.trim(),
    revisadoPor: perfil.uid,
    revisadoEn: serverTimestamp(),
  });
