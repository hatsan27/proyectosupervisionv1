// Carga los avisos visibles para el perfil actual.
import { useCallback, useEffect, useState } from 'react';
import { obtenerAvisos } from '../services/avisosService';
import { useAuth } from './useAuth';

export const useAvisos = () => {
  const { perfil } = useAuth();
  const [avisos, setAvisos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    if (!perfil) return;
    setCargando(true);
    setError(null);
    try {
      setAvisos(await obtenerAvisos(perfil));
    } catch (e) {
      console.error('[avisos]', e);
      setError(e);
    } finally {
      setCargando(false);
    }
  }, [perfil]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { avisos, cargando, error, recargar: cargar };
};
