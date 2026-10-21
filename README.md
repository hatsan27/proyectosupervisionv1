# Plataforma web · Supervisión Escolar 072

Plataforma para la comunicación, gestión documental y captura de información de la Supervisión Escolar de la Zona 072 (Sector 017 de Educación Preescolar, Huetamo, Mich.). Es el proyecto de residencia profesional de Ingeniería en Sistemas Computacionales.

**Estado:** actividades 1 a 8 del cronograma (autenticación por roles y módulo de avisos).

| Capa | Tecnología |
|---|---|
| Interfaz | React 18 + Vite, React Router, íconos lucide-react |
| Autenticación | Firebase Authentication (correo y contraseña) |
| Base de datos | Cloud Firestore + reglas de seguridad (`firestore.rules`) |
| Publicación | Netlify (compilación automática desde GitHub) |

---

## 1. Estructura del proyecto

```
supervision-072/
├── index.html                  Página base de Vite
├── netlify.toml                Compilación y redirecciones para Netlify
├── firebase.json               Reglas, índices y emuladores de Firebase
├── firestore.rules             Reglas de seguridad por rol y plantel
├── firestore.indexes.json
├── .env.example                Plantilla de variables de entorno
├── public/favicon.svg
├── scripts/
│   ├── seed-emulador.mjs       Datos ficticios para los emuladores
│   └── probar-reglas.mjs       Pruebas automáticas de permisos (21 casos)
└── src/
    ├── main.jsx                Punto de entrada
    ├── App.jsx                 Mapa de rutas (P-01 a P-09)
    ├── firebase/config.js      Inicialización de Firebase
    ├── services/               Acceso a datos (una función por operación)
    │   ├── authService.js        Iniciar y cerrar sesión
    │   ├── usuariosService.js    Perfil, rol y validación de cuenta activa
    │   ├── plantelesService.js   Catálogo de planteles
    │   └── avisosService.js      Consultar y publicar avisos
    ├── context/AuthContext.jsx Sesión y perfil disponibles en toda la app
    ├── hooks/                  useAuth, useAvisos, usePlanteles
    ├── routes/                 ProtectedRoute (sesión) y RoleRoute (rol)
    ├── layouts/AppLayout.jsx   Barra lateral + barra superior + contenido
    ├── components/
    │   ├── layout/             Sidebar, Topbar, MobileNav, Footer
    │   ├── ui/                 Brand, Alert, Loader, PageHeading, EmptyState
    │   └── avisos/             AvisoCard y utilidades de destinatarios
    ├── pages/                  Una pantalla por archivo
    │   ├── LoginPage.jsx         P-01 Inicio de sesión
    │   ├── PanelPage.jsx         P-02 Panel principal
    │   ├── AvisosPage.jsx        P-03 Listado de avisos
    │   ├── AvisoDetallePage.jsx  P-03 Lectura de un aviso
    │   ├── NuevoAvisoPage.jsx    P-04 Nuevo aviso (solo supervisora)
    │   ├── ProximamentePage.jsx  P-05 a P-09 (actividades 9 a 11)
    │   ├── AccesoDenegadoPage.jsx
    │   └── NoEncontradaPage.jsx
    ├── constants/              Roles y opciones de navegación
    ├── utils/                  Fechas y mensajes de error en español
    └── styles/                 CSS dividido por sección (index.css los importa)
```

---

## 2. Ejecutar en tu computadora

Requisito: Node.js 20 o superior.

```bash
npm install
cp .env.example .env      # y captura los valores de tu proyecto Firebase
npm run dev               # abre http://localhost:5173
```

Para generar la versión de producción: `npm run build`. El resultado queda en `dist/`.

---

## 3. Configurar Firebase (una sola vez)

1. **Firebase Console → Configuración del proyecto → Tus apps → App web.** Copia los valores de `firebaseConfig` al archivo `.env`.
2. **Authentication → Método de acceso.** Habilita *Correo electrónico/contraseña*.
3. **Authentication → Configuración → Dominios autorizados.** Agrega el dominio de Netlify, por ejemplo `tu-sitio.netlify.app`.
4. **Firestore Database.** Crea la base de datos y después las colecciones de la sección 4.
5. **Publica las reglas** desde la terminal:
   ```bash
   npx firebase login
   cp .firebaserc.example .firebaserc   # y escribe el ID de tu proyecto
   npm run deploy:rules
   ```
   También puedes pegar el contenido de `firestore.rules` en *Firestore → Reglas → Publicar*.

---

## 4. Datos que debes crear en Firestore

Las cuentas se dan de alta desde Firebase Console, no desde la plataforma.

**a) Usuarios.** Primero crea la cuenta en *Authentication → Agregar usuario*. Después copia su **UID** y crea un documento con ese mismo ID:

`usuarios/{UID}`

| Campo | Tipo | Ejemplo |
|---|---|---|
| nombre | string | `María López` |
| correo | string | `maria@correo.com` |
| rol | string | `supervisora`, `administrativa` o `directora` |
| plantelId | string | `jn-benito-juarez` (**obligatorio** si el rol es `directora`) |
| activo | boolean | `true` |

**b) Planteles.** Cada plantel es un documento cuyo ID es una clave corta sin espacios:

`planteles/{plantelId}` → `nombre` (string), `activo` (boolean)

**c) Avisos.** La plataforma los crea sola con estos campos: `titulo`, `contenido`, `creadoPor` (UID), `autorNombre`, `publicadoEn` (fecha del servidor) y `destinatarios` (`["todos"]` o una lista de plantelId).

> La colección `planteles` complementa el modelo del Anexo 4: guarda el catálogo que se usa para elegir destinatarios y mostrar nombres.

---

## 5. Publicar en Netlify

1. Sube el proyecto a GitHub. Gracias a `.gitignore`, `.env` y `node_modules` no se suben.
2. En Netlify ve a **Add new site → Import from Git** y elige el repositorio. `netlify.toml` ya define el comando `npm run build` y la carpeta `dist`.
3. En **Site configuration → Environment variables** agrega las mismas variables `VITE_FIREBASE_*` de tu `.env`. Deja `VITE_USE_EMULATORS` sin definir o con el valor `false`.
4. Ejecuta **Deploy**. Cada `git push` a la rama principal vuelve a publicar el sitio.

La redirección `/* → /index.html` de `netlify.toml` permite que funcione recargar páginas como `/avisos/nuevo`.

---

## 6. Probar sin tocar el proyecto real (emuladores)

```bash
npm run emulators          # terminal 1: Auth + Firestore locales (requiere Java)
npm run seed:emulador      # terminal 2: crea planteles, cuentas y avisos ficticios
npm run test:reglas        # comprueba los permisos de los Anexos 7 y 8
```

Para usar la interfaz con los emuladores, pon `VITE_USE_EMULATORS=true` en `.env` y ejecuta `npm run dev`.

Cuentas de prueba (contraseña `Prueba072`):

| Correo | Perfil |
|---|---|
| supervisora@prueba.mx | Supervisora |
| administrativa@prueba.mx | Personal administrativo |
| directora1@prueba.mx | Directora · J.N. Benito Juárez |
| directora2@prueba.mx | Directora · J.N. Sor Juana Inés de la Cruz |
| inactiva@prueba.mx | Cuenta inactiva (no entra) |
| sinperfil@prueba.mx | Cuenta sin perfil (no entra) |

---

## 7. Referencias de código para los anexos

| Anexo | Elemento | Archivo |
|---|---|---|
| 5 | Página principal | `index.html`, `src/App.jsx` |
| 5 | Estilos | `src/styles/` |
| 5 / 6 | Despliegue | `netlify.toml` |
| 6 / 7 | Configuración Firebase | `src/firebase/config.js` |
| 4 / 7 / 8 | Reglas de Firestore | `firestore.rules` |
| 7 | Inicio de sesión | `src/pages/LoginPage.jsx`, `src/services/authService.js` |
| 7 | Consulta de perfiles y roles | `src/services/usuariosService.js`, `src/context/AuthContext.jsx`, `src/routes/RoleRoute.jsx` |
| 8 | Listado P-03 | `src/pages/AvisosPage.jsx`, `src/pages/AvisoDetallePage.jsx` |
| 8 | Publicación P-04 | `src/pages/NuevoAvisoPage.jsx` |
| 8 | Consultas y escrituras Firestore | `src/services/avisosService.js` |
| 7 / 8 | Pruebas de acceso | `scripts/probar-reglas.mjs` |
