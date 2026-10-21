// Pruebas automáticas de las reglas de seguridad contra los EMULADORES.
// Comprueba los casos de los Anexos 7 y 8. Requiere: npm run emulators + npm run seed:emulador
// Uso: npm run test:reglas
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  addDoc, collection, connectFirestoreEmulator, doc, getDoc, getDocs, getFirestore,
  query, serverTimestamp, where, deleteDoc,
} from 'firebase/firestore';

const app = initializeApp({ apiKey: 'demo', projectId: process.env.GCLOUD_PROJECT ?? 'demo-supervision072' });
const auth = getAuth(app);
const db = getFirestore(app);
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
connectFirestoreEmulator(db, '127.0.0.1', 8080);

const PASS = 'Prueba072';
let ok = 0, fallos = 0;

const caso = async (nombre, esperado, fn) => {
  let resultado;
  try { await fn(); resultado = 'permitido'; } catch (e) {
    resultado = e.code === 'permission-denied' ? 'denegado' : `error (${e.code ?? e.message})`;
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

await signOut(auth);
console.log(`\nResultado: ${ok} correctas, ${fallos} incorrectas.`);
process.exit(fallos ? 1 : 0);
