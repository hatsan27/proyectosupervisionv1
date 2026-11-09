// Carga y descarga de archivos de evidencia en Cloud Storage (RF-05).
// Si en el futuro se usa otro servicio de almacenamiento, solo cambia este archivo.
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from '../firebase/config';

export const TAMANO_MAXIMO = 10 * 1024 * 1024; // 10 MB

export const EXTENSIONES_PERMITIDAS = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
// Los formatos del banco no admiten imágenes.
export const EXTENSIONES_FORMATOS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

const TIPOS_POR_EXTENSION = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

const extension = (nombre = '') => nombre.split('.').pop().toLowerCase();

/** Devuelve un mensaje de error si el archivo no es válido, o null si se puede subir. */
export const validarArchivo = (archivo, permitidas = EXTENSIONES_PERMITIDAS) => {
  if (!archivo) return 'Seleccione un archivo.';
  if (!permitidas.includes(extension(archivo.name))) {
    return permitidas.includes('png')
      ? 'Tipo de archivo no permitido. Use PDF, imagen, Word, Excel o PowerPoint.'
      : 'Tipo de archivo no permitido. Use PDF, Word, Excel o PowerPoint.';
  }
  if (archivo.size > TAMANO_MAXIMO) return 'El archivo supera el máximo de 10 MB.';
  if (archivo.size === 0) return 'El archivo está vacío.';
  return null;
};

// Nombre seguro para la ruta: sin acentos, espacios ni símbolos. El nombre original se guarda aparte.
const nombreSeguro = (nombre) =>
  nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .slice(-80);

/**
 * Sube un archivo a la carpeta indicada y devuelve su referencia para guardarla en Firestore.
 * @returns {Promise<{nombre:string, ruta:string, tipo:string, tamano:number}>}
 */
export const subirArchivo = ({ carpeta, archivo, onProgreso }) =>
  new Promise((resolve, reject) => {
    const tipo = TIPOS_POR_EXTENSION[extension(archivo.name)] ?? archivo.type;
    const ruta = `${carpeta}/${Date.now()}_${nombreSeguro(archivo.name)}`;
    const tarea = uploadBytesResumable(ref(storage, ruta), archivo, {
      contentType: tipo,
      customMetadata: { nombreOriginal: archivo.name },
    });

    tarea.on(
      'state_changed',
      (snap) => onProgreso?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      () => resolve({ nombre: archivo.name, ruta, tipo, tamano: archivo.size }),
    );
  });

/** Evidencia de un plantel para una solicitud (actividad 9). */
export const subirEvidencia = ({ solicitudId, plantelId, archivo, onProgreso }) =>
  subirArchivo({ carpeta: `entregas/${solicitudId}/${plantelId}`, archivo, onProgreso });

export const obtenerUrlDescarga = (ruta) => getDownloadURL(ref(storage, ruta));

export const eliminarArchivo = async (ruta) => {
  try {
    await deleteObject(ref(storage, ruta));
  } catch (e) {
    if (e.code !== 'storage/object-not-found') console.warn('[storage] No se pudo eliminar', ruta, e.code);
  }
};

export const formatoTamano = (bytes = 0) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
