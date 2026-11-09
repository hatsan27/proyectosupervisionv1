// Abre el archivo de evidencia en una pestaña nueva (la URL se pide a Storage al momento).
import { useState } from 'react';
import { Download } from 'lucide-react';
import { obtenerUrlDescarga, formatoTamano } from '../../services/storageService';

export default function BotonDescarga({ archivo, compacto = false }) {
  const [abriendo, setAbriendo] = useState(false);
  const [error, setError] = useState(false);

  const abrir = async () => {
    setError(false);
    setAbriendo(true);
    // Se abre la pestaña antes de la petición para que el navegador no la bloquee.
    const pestana = window.open('', '_blank');
    try {
      const url = await obtenerUrlDescarga(archivo.ruta);
      if (pestana) pestana.location.href = url;
      else window.location.href = url;
    } catch (e) {
      console.error('[descarga]', e);
      pestana?.close();
      setError(true);
    } finally {
      setAbriendo(false);
    }
  };

  return (
    <button type="button" className={`file-chip${compacto ? ' file-chip-compact' : ''}`} onClick={abrir} disabled={abriendo} title={archivo.nombre}>
      <Download size={15} aria-hidden="true" />
      <span className="file-chip-name">{abriendo ? 'Abriendo…' : archivo.nombre}</span>
      {!compacto && <small>{formatoTamano(archivo.tamano)}</small>}
      {error && <small className="form-error">No disponible</small>}
    </button>
  );
}
