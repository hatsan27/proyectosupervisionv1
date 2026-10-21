// Contexto de sesión: escucha Firebase Authentication y carga el perfil
// (rol y plantel) desde Firestore. Implementa el flujo del Anexo 3, pasos 1 a 4.
import { createContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { cerrarSesion } from '../services/authService';
import { obtenerPerfil } from '../services/usuariosService';
import { obtenerPlantel } from '../services/plantelesService';
import { mensajeDeError } from '../utils/firebaseErrors';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [estado, setEstado] = useState('cargando'); // 'cargando' | 'sin-sesion' | 'autenticado'
  const [perfil, setPerfil] = useState(null);
  const [errorAcceso, setErrorAcceso] = useState('');
  // true cuando la usuaria cerró sesión con el botón: el siguiente ingreso abre el panel.
  const [salidaVoluntaria, setSalidaVoluntaria] = useState(false);

  useEffect(() => {
    const desuscribir = onAuthStateChanged(auth, async (usuario) => {
      if (!usuario) {
        setPerfil(null);
        setEstado('sin-sesion');
        return;
      }

      setEstado('cargando');
      try {
        const datos = await obtenerPerfil(usuario.uid);
        if (datos.plantelId) {
          const plantel = await obtenerPlantel(datos.plantelId).catch(() => null);
          datos.plantelNombre = plantel?.nombre ?? datos.plantelId;
        }
        setErrorAcceso('');
        setSalidaVoluntaria(false);
        setPerfil(datos);
        setEstado('autenticado');
      } catch (error) {
        // Cuenta sin perfil autorizado o inactiva: se cierra la sesión.
        setErrorAcceso(mensajeDeError(error));
        setPerfil(null);
        await cerrarSesion();
      }
    });
    return desuscribir;
  }, []);

  const valor = useMemo(
    () => ({
      estado,
      perfil,
      errorAcceso,
      limpiarError: () => setErrorAcceso(''),
      salidaVoluntaria,
      salir: async () => {
        setSalidaVoluntaria(true);
        await cerrarSesion();
      },
    }),
    [estado, perfil, errorAcceso, salidaVoluntaria],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
