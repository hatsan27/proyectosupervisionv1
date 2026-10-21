// Operaciones de Firebase Authentication (RF-01).
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase/config';

export const iniciarSesion = (correo, contrasena) =>
  signInWithEmailAndPassword(auth, correo.trim(), contrasena);

export const cerrarSesion = () => signOut(auth);
