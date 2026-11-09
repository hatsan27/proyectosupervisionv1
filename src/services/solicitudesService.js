// Solicitudes de evidencia (RF-04): consulta, creación y cierre.
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { ROLES } from '../constants/roles';
import { SOLICITUD_ABIERTA } from '../constants/estados';

const solicitudesRef = collection(db, 'solicitudes');
const mapear = (snap) => ({ id: snap.id, ...snap.data() });

/** Solicitudes visibles para el perfil. La directora solo consulta las de su plantel. */
export const obtenerSolicitudes = async (perfil) => {
  if (perfil.rol === ROLES.DIRECTORA) {
    const q = query(solicitudesRef, where('plantelIds', 'array-contains-any', [perfil.plantelId]));
    const snap = await getDocs(q);
    // Primero las que vencen antes.
    return snap.docs.map(mapear).sort((a, b) => a.fechaLimite.toMillis() - b.fechaLimite.toMillis());
  }
  const snap = await getDocs(query(solicitudesRef, orderBy('creadoEn', 'desc')));
  return snap.docs.map(mapear);
};

export const obtenerSolicitud = async (solicitudId) => {
  const snap = await getDoc(doc(db, 'solicitudes', solicitudId));
  return snap.exists() ? mapear(snap) : null;
};

/**
 * Crea una solicitud. fechaLimite es una cadena "AAAA-MM-DD"; se guarda al final de ese día.
 * @param {{titulo:string, descripcion:string, fechaLimite:string, plantelIds:string[]}} datos
 */
export const crearSolicitud = async ({ titulo, descripcion, fechaLimite, plantelIds }, perfil) => {
  const [a, m, d] = fechaLimite.split('-').map(Number);
  const ref = await addDoc(solicitudesRef, {
    titulo: titulo.trim(),
    descripcion: descripcion.trim(),
    fechaLimite: Timestamp.fromDate(new Date(a, m - 1, d, 23, 59, 59)),
    plantelIds,
    estado: SOLICITUD_ABIERTA,
    creadoPor: perfil.uid,
    autorNombre: perfil.nombre ?? '',
    creadoEn: serverTimestamp(),
  });
  return ref.id;
};

/** Abre o cierra una solicitud (cerrada = ya no recibe archivos). */
export const cambiarEstadoSolicitud = (solicitudId, estado) =>
  updateDoc(doc(db, 'solicitudes', solicitudId), { estado });

export const estaVencida = (solicitud) => solicitud.fechaLimite?.toMillis?.() < Date.now();
