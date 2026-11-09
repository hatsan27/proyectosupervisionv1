// Pruebas automáticas de las reglas de seguridad contra los EMULADORES.
// Comprueba los casos de los Anexos 7 a 11: autenticación, avisos, solicitudes y evidencias,
// banco de formatos, formularios y respuestas. Requiere: npm run emulators + npm run seed:emulador
// Uso: npm run test:reglas
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  addDoc, collection, connectFirestoreEmulator, doc, getDoc, getDocs, getFirestore,
  query, serverTimestamp, where, deleteDoc, setDoc, updateDoc, Timestamp,
} from 'firebase/firestore';
import { connectStorageEmulator, getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';

const PROJECT = process.env.GCLOUD_PROJECT ?? 'demo-supervision072';
const app = initializeApp({ apiKey: 'demo', projectId: PROJECT, storageBucket: `${PROJECT}.appspot.com` });
const auth = getAuth(app);
const db = getFirestore(app);
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
connectFirestoreEmulator(db, '127.0.0.1', 8080);
const storage = getStorage(app);
connectStorageEmulator(storage, '127.0.0.1', 9199);

const PASS = 'Prueba072';
let ok = 0, fallos = 0;

const caso = async (nombre, esperado, fn) => {
  let resultado;
  try { await fn(); resultado = 'permitido'; } catch (e) {
    resultado = ['permission-denied', 'storage/unauthorized'].includes(e.code) ? 'denegado' : `error (${e.code ?? e.message})`;
  }
  const bien = resultado === esperado;
  bien ? ok++ : fallos++;
  console.log(`${bien ? '✔' : '✘'} ${nombre} → ${resultado}${bien ? '' : ` (se esperaba ${esperado})`}`);
};

const como = async (correo) => { await signOut(auth); if (correo) await signInWithEmailAndPassword(auth, correo, PASS); };
const avisoNuevo = (uid, extra = {}) => ({
  titulo: 'Aviso de prueba automática', contenido: 'Contenido de prueba.', destinatarios: ['todos'],
  creadoPor: uid, autorNombre: 'Prueba', publicadoEn: serverTimestamp(), ...extra,
});
const avisosDirectora = (plantelId) =>
  getDocs(query(collection(db, 'avisos'), where('destinatarios', 'array-contains-any', ['todos', plantelId])));

console.log('\n— Sin sesión —');
await como(null);
await caso('Leer avisos sin sesión', 'denegado', () => getDocs(collection(db, 'avisos')));

console.log('\n— Supervisora —');
await como('supervisora@prueba.mx');
const supUid = auth.currentUser.uid;
await caso('Leer su perfil', 'permitido', () => getDoc(doc(db, 'usuarios', supUid)));
await caso('Leer todos los avisos', 'permitido', () => getDocs(collection(db, 'avisos')));
let creado;
await caso('Publicar aviso válido', 'permitido', async () => { creado = await addDoc(collection(db, 'avisos'), avisoNuevo(supUid)); });
await caso('Publicar aviso a nombre de otra persona', 'denegado', () => addDoc(collection(db, 'avisos'), avisoNuevo('otro-uid')));
await caso('Publicar aviso sin título', 'denegado', () => addDoc(collection(db, 'avisos'), avisoNuevo(supUid, { titulo: '' })));
await caso('Publicar aviso sin destinatarios', 'denegado', () => addDoc(collection(db, 'avisos'), avisoNuevo(supUid, { destinatarios: [] })));
await caso('Publicar aviso con campos extra', 'denegado', () => addDoc(collection(db, 'avisos'), avisoNuevo(supUid, { urgente: true })));
await caso('Eliminar aviso propio de prueba', 'permitido', () => deleteDoc(creado));

console.log('\n— Personal administrativo —');
await como('administrativa@prueba.mx');
await caso('Leer avisos', 'permitido', () => getDocs(collection(db, 'avisos')));
await caso('Publicar aviso', 'denegado', () => addDoc(collection(db, 'avisos'), avisoNuevo(auth.currentUser.uid)));

console.log('\n— Directora del plantel J.N. Benito Juárez —');
await como('directora1@prueba.mx');
const d1 = auth.currentUser.uid;
await caso('Leer avisos generales y de su plantel', 'permitido', async () => {
  const snap = await avisosDirectora('jn-benito-juarez');
  const ajenos = snap.docs.filter((d) => !d.data().destinatarios.some((x) => ['todos', 'jn-benito-juarez'].includes(x)));
  const ids = snap.docs.map((d) => d.id);
  if (ajenos.length || !ids.includes('aviso-general') || !ids.includes('aviso-benito')) {
    throw new Error(`resultado inesperado: ${ids.join(',')}`);
  }
});
await caso('Leer aviso general por ID', 'permitido', () => getDoc(doc(db, 'avisos', 'aviso-general')));
await caso('Leer aviso de otro plantel por ID', 'denegado', () => getDoc(doc(db, 'avisos', 'aviso-sorjuana')));
await caso('Consultar avisos de otro plantel', 'denegado', () => avisosDirectora('jn-sor-juana'));
await caso('Consultar toda la colección avisos', 'denegado', () => getDocs(collection(db, 'avisos')));
await caso('Publicar aviso', 'denegado', () => addDoc(collection(db, 'avisos'), avisoNuevo(d1)));
await caso('Leer el perfil de otra usuaria', 'denegado', () => getDoc(doc(db, 'usuarios', supUid)));

console.log('\n— Cuenta inactiva —');
await como('inactiva@prueba.mx');
await caso('Leer avisos generales', 'denegado', () => avisosDirectora('jn-emiliano-zapata'));

console.log('\n— Cuenta autenticada sin perfil —');
await como('sinperfil@prueba.mx');
await caso('Leer avisos', 'denegado', () => getDocs(collection(db, 'avisos')));
await caso('Leer planteles', 'denegado', () => getDocs(collection(db, 'planteles')));

// ===================== Actividad 9: solicitudes y evidencias =====================
const pdf = new TextEncoder().encode('%PDF-1.4 prueba');
const subir = (ruta, tipo = 'application/pdf') => uploadBytes(ref(storage, ruta), pdf, { contentType: tipo });
const solicitudNueva = (uid, extra = {}) => ({
  titulo: 'Solicitud de prueba automática', descripcion: 'Prueba', fechaLimite: Timestamp.fromDate(new Date(Date.now() + 864e5)),
  plantelIds: ['jn-benito-juarez'], estado: 'abierta', creadoPor: uid, autorNombre: 'Prueba', creadoEn: serverTimestamp(), ...extra,
});
let SOL = ''; // solicitud creada en cada corrida para que las pruebas sean independientes
let RUTA_B = '';
const entregaDe = (uid, plantelId = 'jn-benito-juarez', extra = {}) => ({
  solicitudId: SOL, plantelId, estado: 'entregado',
  archivo: { nombre: 'plan.pdf', ruta: RUTA_B, tipo: 'application/pdf', tamano: pdf.length },
  enviadoPor: uid, enviadoEn: serverTimestamp(), ...extra,
});
const refEntregaB = () => doc(db, 'entregas', `${SOL}_jn-benito-juarez`);
const solicitudesDirectora = (plantelId) =>
  getDocs(query(collection(db, 'solicitudes'), where('plantelIds', 'array-contains-any', [plantelId])));

console.log('\n— Solicitudes: supervisora y personal administrativo —');
await como('supervisora@prueba.mx');
let solPrueba;
await caso('Supervisora crea solicitud válida', 'permitido', async () => { solPrueba = await addDoc(collection(db, 'solicitudes'), solicitudNueva(auth.currentUser.uid)); });
const solFlujo = await addDoc(collection(db, 'solicitudes'),
  solicitudNueva(auth.currentUser.uid, { plantelIds: ['jn-benito-juarez', 'jn-sor-juana'], titulo: 'Flujo de evidencia (prueba)' }));
SOL = solFlujo.id;
RUTA_B = `entregas/${SOL}/jn-benito-juarez/${Date.now()}_plan.pdf`;
await caso('Crear solicitud sin planteles', 'denegado', () => addDoc(collection(db, 'solicitudes'), solicitudNueva(auth.currentUser.uid, { plantelIds: [] })));
await caso('Crear solicitud ya cerrada', 'denegado', () => addDoc(collection(db, 'solicitudes'), solicitudNueva(auth.currentUser.uid, { estado: 'cerrada' })));
await como('administrativa@prueba.mx');
await caso('Administrativa crea solicitud', 'permitido', () => addDoc(collection(db, 'solicitudes'), solicitudNueva(auth.currentUser.uid)));
await caso('Administrativa cierra solicitud ajena', 'denegado', () => updateDoc(solPrueba, { estado: 'cerrada' }));

console.log('\n— Evidencias: directora de J.N. Benito Juárez —');
await como('directora1@prueba.mx');
const d1u = auth.currentUser.uid;
await caso('Consultar solicitudes de su plantel', 'permitido', async () => {
  const snap = await solicitudesDirectora('jn-benito-juarez');
  if (!snap.docs.every((d) => d.data().plantelIds.includes('jn-benito-juarez'))) throw new Error('recibió solicitudes ajenas');
});
await caso('Consultar toda la colección solicitudes', 'denegado', () => getDocs(collection(db, 'solicitudes')));
await caso('Crear una solicitud', 'denegado', () => addDoc(collection(db, 'solicitudes'), solicitudNueva(d1u)));
await caso('Subir PDF para su plantel', 'permitido', () => subir(RUTA_B));
await caso('Subir archivo en la carpeta de otro plantel', 'denegado', () => subir(`entregas/${SOL}/jn-sor-juana/${Date.now()}_x.pdf`));
await caso('Subir archivo ejecutable (.exe)', 'denegado', () => subir(`entregas/${SOL}/jn-benito-juarez/${Date.now()}_x.exe`, 'application/x-msdownload'));
await caso('Subir archivo a solicitud cerrada', 'denegado', () => subir(`entregas/sol-cerrada/jn-benito-juarez/${Date.now()}_x.pdf`));
await caso('Registrar entrega válida', 'permitido', () => setDoc(refEntregaB(), entregaDe(d1u)));
await caso('Registrar entrega a nombre de otro plantel', 'denegado', () =>
  setDoc(doc(db, 'entregas', `${SOL}_jn-sor-juana`), entregaDe(d1u, 'jn-sor-juana')));
await caso('Marcar su propia entrega como aceptada', 'denegado', () => setDoc(refEntregaB(), entregaDe(d1u, 'jn-benito-juarez', { estado: 'aceptado' })));
await caso('Consultar sus entregas', 'permitido', () => getDocs(query(collection(db, 'entregas'), where('plantelId', '==', 'jn-benito-juarez'))));

console.log('\n— Evidencias: directora de otro plantel —');
await como('directora2@prueba.mx');
await caso('Consultar entregas de otro plantel', 'denegado', () =>
  getDocs(query(collection(db, 'entregas'), where('solicitudId', '==', SOL))));
await caso('Descargar archivo de otro plantel', 'denegado', () => getDownloadURL(ref(storage, RUTA_B)));
await caso('Abrir solicitud dirigida solo a otro plantel', 'denegado', () => getDoc(doc(db, 'solicitudes', 'sol-inscripcion')));

console.log('\n— Revisión por la supervisora —');
await como('supervisora@prueba.mx');
const supU = auth.currentUser.uid;
await caso('Descargar evidencia de un plantel', 'permitido', () => getDownloadURL(ref(storage, RUTA_B)));
const revision = (estado, comentario, extra = {}) =>
  updateDoc(refEntregaB(), { estado, comentarioRevision: comentario, revisadoPor: supU, revisadoEn: serverTimestamp(), ...extra });
await caso('Pedir corrección sin observaciones', 'denegado', () => revision('correccion', ''));
await caso('Modificar el archivo del plantel al revisar', 'denegado', () => revision('aceptado', '', { 'archivo.nombre': 'otro.pdf' }));
await caso('Pedir corrección con observaciones', 'permitido', () => revision('correccion', 'Falta la firma de la directora.'));

await como('directora1@prueba.mx');
await caso('Reenviar evidencia corregida', 'permitido', () => setDoc(refEntregaB(), entregaDe(d1u)));

await como('supervisora@prueba.mx');
await caso('Aceptar la entrega', 'permitido', () => revision('aceptado', ''));

await como('directora1@prueba.mx');
await caso('Reenviar después de ser aceptada', 'denegado', () => setDoc(refEntregaB(), entregaDe(d1u)));
await caso('Subir archivo después de ser aceptada', 'denegado', () => subir(`entregas/${SOL}/jn-benito-juarez/${Date.now()}_y.pdf`));

await como('supervisora@prueba.mx');
await caso('Cerrar su solicitud', 'permitido', () => updateDoc(solFlujo, { estado: 'cerrada' }));
await deleteDoc(solPrueba).catch(() => {});

// ===================== Actividad 10: banco de formatos =====================
const docx = new TextEncoder().encode('PK formato de prueba');
const TIPO_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const formatoNuevo = (uid, id, extra = {}) => ({
  titulo: 'Formato de prueba automática', descripcion: '', categoria: 'estadistica',
  archivo: { nombre: 'formato.xlsx', ruta: `formatos/${id}/${Date.now()}_formato.xlsx`, tipo: TIPO_XLSX, tamano: docx.length },
  vigente: true, subidoPor: uid, subidoEn: serverTimestamp(), actualizadoEn: serverTimestamp(), ...extra,
});

console.log('\n— Banco de formatos: supervisión —');
await como('administrativa@prueba.mx');
const admU = auth.currentUser.uid;
const refFormato = doc(collection(db, 'formatos'));
const datosFormato = formatoNuevo(admU, refFormato.id);
await caso('Subir archivo de formato', 'permitido', () => uploadBytes(ref(storage, datosFormato.archivo.ruta), docx, { contentType: TIPO_XLSX }));
await caso('Publicar formato válido', 'permitido', () => setDoc(refFormato, datosFormato));
await caso('Publicar con categoría inválida', 'denegado', () => {
  const r = doc(collection(db, 'formatos')); return setDoc(r, formatoNuevo(admU, r.id, { categoria: 'secreta' }));
});
await caso('Publicar con archivo de otro formato', 'denegado', () => setDoc(doc(collection(db, 'formatos')), formatoNuevo(admU, refFormato.id)));

console.log('\n— Banco de formatos: directora —');
await como('directora1@prueba.mx');
await caso('Consultar formatos vigentes', 'permitido', () => getDocs(query(collection(db, 'formatos'), where('vigente', '==', true))));
await caso('Consultar toda la colección formatos', 'denegado', () => getDocs(collection(db, 'formatos')));
await caso('Descargar formato vigente', 'permitido', () => getDownloadURL(ref(storage, datosFormato.archivo.ruta)));
await caso('Subir archivo al banco de formatos', 'denegado', () => uploadBytes(ref(storage, `formatos/${refFormato.id}/x.xlsx`), docx, { contentType: TIPO_XLSX }));
await caso('Publicar un formato', 'denegado', () => {
  const r = doc(collection(db, 'formatos')); return setDoc(r, formatoNuevo(auth.currentUser.uid, r.id));
});

await como('supervisora@prueba.mx');
await caso('Retirar formato', 'permitido', () => updateDoc(refFormato, { vigente: false, actualizadoEn: serverTimestamp() }));
await como('directora1@prueba.mx');
await caso('Abrir formato retirado', 'denegado', () => getDoc(refFormato));
await caso('Descargar formato retirado', 'denegado', () => getDownloadURL(ref(storage, datosFormato.archivo.ruta)));
await como('administrativa@prueba.mx');
await caso('Administrativa elimina definitivamente', 'denegado', () => deleteDoc(refFormato));
await como('supervisora@prueba.mx');
await caso('Supervisora elimina definitivamente', 'permitido', () => deleteDoc(refFormato));

// ===================== Actividades 11 y 12: formularios y respuestas =====================
const camposPrueba = [
  { id: 'cab12cd', tipo: 'numero', etiqueta: 'Total de alumnos', requerido: true, min: 0 },
  { id: 'cef34gh', tipo: 'tabla', etiqueta: 'Alumnos por grado', requerido: true, columnas: ['Grado', 'Niños', 'Niñas'] },
];
const formularioNuevo = (uid, extra = {}) => ({
  titulo: 'Formulario de prueba automática', descripcion: '', campos: camposPrueba,
  plantelIds: ['jn-benito-juarez', 'jn-sor-juana'], fechaLimite: Timestamp.fromDate(new Date(Date.now() + 864e5)),
  estado: 'borrador', creadoPor: uid, autorNombre: 'Prueba', creadoEn: serverTimestamp(), ...extra,
});
const respuestaDe = (fid, uid, plantelId = 'jn-benito-juarez', extra = {}) => ({
  formularioId: fid, plantelId, valores: { cab12cd: 30, cef34gh: [{ c0: '1°', c1: '8', c2: '7' }] },
  enviadoPor: uid, enviadoEn: serverTimestamp(), actualizadoEn: serverTimestamp(), ...extra,
});

console.log('\n— Formularios: diseño y publicación —');
await como('administrativa@prueba.mx');
let refForm;
await caso('Crear formulario en borrador', 'permitido', async () => { refForm = await addDoc(collection(db, 'formularios'), formularioNuevo(admU)); });
await caso('Crear formulario ya publicado', 'denegado', () => addDoc(collection(db, 'formularios'), formularioNuevo(admU, { estado: 'publicado' })));
await caso('Publicar formulario sin campos', 'denegado', async () => {
  const r = await addDoc(collection(db, 'formularios'), formularioNuevo(admU, { campos: [] }));
  await updateDoc(r, { estado: 'publicado' });
});
await como('directora1@prueba.mx');
await caso('Directora abre un borrador', 'denegado', () => getDoc(refForm));
await caso('Directora crea un formulario', 'denegado', () => addDoc(collection(db, 'formularios'), formularioNuevo(auth.currentUser.uid)));
await como('administrativa@prueba.mx');
await caso('Publicar el formulario', 'permitido', () => updateDoc(refForm, { estado: 'publicado', publicadoEn: serverTimestamp() }));
await caso('Cambiar campos después de publicar', 'denegado', () => updateDoc(refForm, { campos: [camposPrueba[0]] }));
await caso('Regresar de publicado a borrador', 'denegado', () => updateDoc(refForm, { estado: 'borrador' }));

console.log('\n— Respuestas: directoras —');
await como('directora1@prueba.mx');
const d1r = auth.currentUser.uid;
const refResp = doc(db, 'respuestas', `${refForm.id}_jn-benito-juarez`);
await caso('Consultar formularios publicados de su plantel', 'permitido', () =>
  getDocs(query(collection(db, 'formularios'), where('plantelIds', 'array-contains', 'jn-benito-juarez'), where('estado', 'in', ['publicado', 'cerrado']))));
await caso('Consultar toda la colección formularios', 'denegado', () => getDocs(collection(db, 'formularios')));
await caso('Consultar su respuesta aún inexistente', 'permitido', () => getDoc(refResp));
await caso('Enviar respuesta válida', 'permitido', () => setDoc(refResp, respuestaDe(refForm.id, d1r)));
await caso('Enviar respuesta a nombre de otro plantel', 'denegado', () =>
  setDoc(doc(db, 'respuestas', `${refForm.id}_jn-sor-juana`), respuestaDe(refForm.id, d1r, 'jn-sor-juana')));
await caso('Modificar su respuesta', 'permitido', () =>
  updateDoc(refResp, { valores: { cab12cd: 31, cef34gh: [] }, enviadoPor: d1r, actualizadoEn: serverTimestamp() }));
await como('directora2@prueba.mx');
await caso('Leer la respuesta de otro plantel', 'denegado', () => getDoc(refResp));

console.log('\n— Concentrado y cierre —');
await como('supervisora@prueba.mx');
await caso('Supervisora consulta respuestas (concentrado)', 'permitido', () =>
  getDocs(query(collection(db, 'respuestas'), where('formularioId', '==', refForm.id))));
await como('administrativa@prueba.mx');
await caso('Cerrar el formulario', 'permitido', () => updateDoc(refForm, { estado: 'cerrado' }));
await como('directora1@prueba.mx');
await caso('Modificar respuesta con formulario cerrado', 'denegado', () =>
  updateDoc(refResp, { valores: { cab12cd: 99, cef34gh: [] }, enviadoPor: d1r, actualizadoEn: serverTimestamp() }));
await como('supervisora@prueba.mx');
await caso('Supervisora elimina el formulario de prueba', 'permitido', () => deleteDoc(refForm));

await signOut(auth);
console.log(`\nResultado: ${ok} correctas, ${fallos} incorrectas.`);
process.exit(fallos ? 1 : 0);
