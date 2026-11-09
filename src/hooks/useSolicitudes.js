// Carga las solicitudes visibles y las entregas relacionadas, y calcula el estado de cada una.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { obtenerSolicitudes } from '../services/solicitudesService';
import { obtenerEntregas } from '../services/entregasService';
import { ESTADOS } from '../constants/estados';
import { useAuth } from './useAuth';

export const useSolicitudes = () => {
  const { perfil } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [entregas, setEntregas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    if (!perfil) return;
    setCargando(true);
    setError(null);
    try {
      const [s, e] = await Promise.all([obtenerSolicitudes(perfil), obtenerEntregas(perfil)]);
      setSolicitudes(s);
      setEntregas(e);
    } catch (err) {
      console.error('[solicitudes]', err);
      setError(err);
    } finally {
      setCargando(false);
    }
  }, [perfil]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Entregas agrupadas por solicitud.
  const entregasPorSolicitud = useMemo(() => {
    const mapa = {};
    entregas.forEach((e) => {
      (mapa[e.solicitudId] ??= []).push(e);
    });
    return mapa;
  }, [entregas]);

  /** Estado de la entrega del plantel de la directora para una solicitud. */
  const estadoDePlantel = useCallback(
    (solicitudId) => entregasPorSolicitud[solicitudId]?.[0]?.estado ?? ESTADOS.PENDIENTE,
    [entregasPorSolicitud],
  );

  /** Resumen de avance de una solicitud (vista de supervisión). */
  const avance = useCallback(
    (solicitud) => {
      const lista = entregasPorSolicitud[solicitud.id] ?? [];
      const contar = (estado) => lista.filter((e) => e.estado === estado).length;
      return {
        total: solicitud.plantelIds.length,
        recibidas: lista.length,
        porRevisar: contar(ESTADOS.ENTREGADO),
        correccion: contar(ESTADOS.CORRECCION),
        aceptadas: contar(ESTADOS.ACEPTADO),
      };
    },
    [entregasPorSolicitud],
  );

  return { solicitudes, entregas, cargando, error, recargar: cargar, estadoDePlantel, avance };
};
