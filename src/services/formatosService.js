// Banco de formatos (RF-07): consultar, publicar, sustituir, retirar y eliminar.
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { ROLES } from '../constants/roles';
import { eliminarArchivo, subirArchivo } from './storageService';

const formatosRef = collection(db, 'formatos');
const mapear = (snap) => ({ id: snap.id, ...snap.data() });

/** La directora solo consulta formatos vigentes; la supervisión, todos. */
export const obtenerFormatos = async (perfil) => {
  const q = perfil.rol === ROLES.DIRECTORA ? query(formatosRef, where('vigente', '==', true)) : formatosRef;
  const snap = await getDocs(q);
  return snap.docs.map(mapear).sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
};

export const obtenerFormato = async (formatoId) => {
  const snap = await getDoc(doc(db, 'formatos', formatoId));
  return snap.exists() ? mapear(snap) : null;
};

/** Publica un formato nuevo: primero sube el archivo y después registra el documento. */
export const publicarFormato = async ({ titulo, descripcion, categoria, archivo, onProgreso }, perfil) => {
  const ref = doc(formatosRef); // ID generado antes, para usarlo en la ruta del archivo
  const datosArchivo = await subirArchivo({ carpeta: `formatos/${ref.id}`, archivo, onProgreso });
  try {
    await setDoc(ref, {
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      categoria,
      archivo: datosArchivo,
      vigente: true,
      subidoPor: perfil.uid,
      subidoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
    });
  } catch (e) {
    await eliminarArchivo(datosArchivo.ruta);
    throw e;
  }
  return ref.id;
};

/** Edita los datos y, si se proporciona, sustituye el archivo por una versión nueva. */
export const actualizarFormato = async (formato, { titulo, descripcion, categoria, archivo, onProgreso }) => {
  let datosArchivo = formato.archivo;
  if (archivo) datosArchivo = await subirArchivo({ carpeta: `formatos/${formato.id}`, archivo, onProgreso });
  try {
    await updateDoc(doc(db, 'formatos', formato.id), {
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      categoria,
      archivo: datosArchivo,
      actualizadoEn: serverTimestamp(),
    });
  } catch (e) {
    if (archivo) await eliminarArchivo(datosArchivo.ruta);
    throw e;
  }
  if (archivo) await eliminarArchivo(formato.archivo.ruta);
};

/** Retirar (vigente = false) o reactivar un formato. No borra el archivo. */
export const cambiarVigencia = (formatoId, vigente) =>
  updateDoc(doc(db, 'formatos', formatoId), { vigente, actualizadoEn: serverTimestamp() });

/** Eliminación definitiva (solo supervisora). */
export const eliminarFormato = async (formato) => {
  await deleteDoc(doc(db, 'formatos', formato.id));
  await eliminarArchivo(formato.archivo.ruta);
};
