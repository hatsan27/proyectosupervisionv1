// Carga datos ficticios en los EMULADORES locales de Firebase (no toca el proyecto real).
// Uso: npm run emulators   (en otra terminal)   →   npm run seed:emulador
// Contraseña de todas las cuentas de prueba: Prueba072

const PROJECT = process.env.GCLOUD_PROJECT ?? 'demo-supervision072';
const AUTH = 'http://127.0.0.1:9099';
const FS = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;
const PASS = 'Prueba072';

const planteles = [
  { id: 'jn-benito-juarez', nombre: 'J.N. Benito Juárez' },
  { id: 'jn-sor-juana', nombre: 'J.N. Sor Juana Inés de la Cruz' },
  { id: 'jn-emiliano-zapata', nombre: 'J.N. Emiliano Zapata' },
];

const usuarios = [
  { correo: 'supervisora@prueba.mx', nombre: 'Supervisora de Prueba', rol: 'supervisora', activo: true },
  { correo: 'administrativa@prueba.mx', nombre: 'Administrativa de Prueba', rol: 'administrativa', activo: true },
  { correo: 'directora1@prueba.mx', nombre: 'Directora Uno', rol: 'directora', plantelId: 'jn-benito-juarez', activo: true },
  { correo: 'directora2@prueba.mx', nombre: 'Directora Dos', rol: 'directora', plantelId: 'jn-sor-juana', activo: true },
  { correo: 'inactiva@prueba.mx', nombre: 'Cuenta Inactiva', rol: 'directora', plantelId: 'jn-emiliano-zapata', activo: false },
  { correo: 'sinperfil@prueba.mx', sinPerfil: true },
];

const aFirestore = (obj) => ({
  fields: Object.fromEntries(
    Object.entries(obj).map(([k, v]) => {
      if (typeof v === 'boolean') return [k, { booleanValue: v }];
      if (Array.isArray(v)) return [k, { arrayValue: { values: v.map((s) => ({ stringValue: s })) } }];
      if (v instanceof Date) return [k, { timestampValue: v.toISOString() }];
      return [k, { stringValue: String(v) }];
    }),
  ),
});

const escribir = (ruta, datos) =>
  fetch(`${FS}/${ruta}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
    body: JSON.stringify(aFirestore(datos)),
  }).then((r) => {
    if (!r.ok) throw new Error(`Firestore ${ruta}: ${r.status}`);
  });

const crearCuenta = async (correo) => {
  const r = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: correo, password: PASS, returnSecureToken: true }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`Auth ${correo}: ${j.error?.message}`);
  return j.localId;
};

const uids = {};
for (const p of planteles) await escribir(`planteles/${p.id}`, { nombre: p.nombre, activo: true });
for (const u of usuarios) {
  const uid = await crearCuenta(u.correo);
  uids[u.correo] = uid;
  if (u.sinPerfil) continue;
  const { sinPerfil, ...perfil } = u;
  await escribir(`usuarios/${uid}`, perfil);
}

const sup = uids['supervisora@prueba.mx'];
const hace = (dias) => new Date(Date.now() - dias * 864e5);
await escribir('avisos/aviso-general', {
  titulo: 'Reunión de directoras',
  contenido: 'Se convoca a todas las directoras a la reunión de zona el próximo viernes a las 10:00 h en la Supervisión.',
  destinatarios: ['todos'], creadoPor: sup, autorNombre: 'Supervisora de Prueba', publicadoEn: hace(1),
});
await escribir('avisos/aviso-benito', {
  titulo: 'Entrega de documentación pendiente',
  contenido: 'Favor de entregar el formato de inscripción actualizado antes del día 30.',
  destinatarios: ['jn-benito-juarez'], creadoPor: sup, autorNombre: 'Supervisora de Prueba', publicadoEn: hace(3),
});
await escribir('avisos/aviso-sorjuana', {
  titulo: 'Visita de acompañamiento',
  contenido: 'La próxima semana se realizará la visita de acompañamiento técnico-pedagógico a su plantel.',
  destinatarios: ['jn-sor-juana'], creadoPor: sup, autorNombre: 'Supervisora de Prueba', publicadoEn: hace(5),
});

console.log('Datos de prueba cargados. Cuentas (contraseña: %s):', PASS);
usuarios.forEach((u) => console.log('  -', u.correo, u.rol ?? '(sin perfil)', u.plantelId ?? ''));
