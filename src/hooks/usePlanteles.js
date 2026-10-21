// Carga el catálogo de planteles y ofrece un mapa id → nombre.
import { useEffect, useMemo, useState } from 'react';
import { obtenerPlanteles } from '../services/plantelesService';

export const usePlanteles = () => {
  const [planteles, setPlanteles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;
    obtenerPlanteles()
      .then((lista) => activo && setPlanteles(lista))
      .catch((e) => activo && setError(e))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, []);

  const nombres = useMemo(
    () => Object.fromEntries(planteles.map((p) => [p.id, p.nombre ?? p.id])),
    [planteles],
  );

  return { planteles, nombres, cargando, error };
};
