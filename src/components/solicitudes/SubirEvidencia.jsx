// P-07 · Carga de evidencia por la directora (RF-05).
import { useRef, useState } from 'react';
import { FileUp, UploadCloud } from 'lucide-react';
import Alert from '../ui/Alert';
import { EXTENSIONES_PERMITIDAS, formatoTamano, validarArchivo } from '../../services/storageService';
import { enviarEvidencia } from '../../services/entregasService';
import { mensajeDeError } from '../../utils/firebaseErrors';

export default function SubirEvidencia({ solicitudId, perfil, entregaAnterior, onEnviado }) {
  const inputRef = useRef(null);
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState('');
  const [progreso, setProgreso] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);

  const elegir = (file) => {
    setError('');
    if (!file) return;
    const problema = validarArchivo(file);
    if (problema) {
      setArchivo(null);
      setError(problema);
      return;
    }
    setArchivo(file);
  };

  const enviar = async () => {
    if (!archivo) return;
    setError('');
    setProgreso(0);
    try {
      await enviarEvidencia({ solicitudId, perfil, archivo, entregaAnterior, onProgreso: setProgreso });
      setArchivo(null);
      setProgreso(null);
      onEnviado?.();
    } catch (e) {
      console.error('[enviar evidencia]', e);
      setError(mensajeDeError(e));
      setProgreso(null);
    }
  };

  const enviando = progreso !== null;

  return (
    <div>
      {error && <Alert tipo="error">{error}</Alert>}

      <div
        className={`upload-mock${arrastrando ? ' upload-drag' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          if (!enviando) elegir(e.dataTransfer.files?.[0]);
        }}
      >
        <div className="upload-mock-icon">
          <UploadCloud size={24} aria-hidden="true" />
        </div>
        {archivo ? (
          <>
            <strong>{archivo.name}</strong>
            <p>{formatoTamano(archivo.size)} · listo para enviar</p>
          </>
        ) : (
          <>
            <strong>{entregaAnterior ? 'Reemplazar el archivo enviado' : 'Arrastre aquí su archivo'}</strong>
            <p>
              o elíjalo desde su equipo. Formatos: {EXTENSIONES_PERMITIDAS.join(', ').toUpperCase()}. Máximo 10 MB.
            </p>
          </>
        )}

        {enviando ? (
          <div className="upload-progress" role="progressbar" aria-valuenow={progreso} aria-valuemin={0} aria-valuemax={100}>
            <div style={{ width: `${progreso}%` }} />
            <span>Subiendo… {progreso}%</span>
          </div>
        ) : (
          <div className="upload-actions">
            <button type="button" className="btn btn-outline" onClick={() => inputRef.current?.click()}>
              <FileUp size={16} aria-hidden="true" /> {archivo ? 'Elegir otro' : 'Elegir archivo'}
            </button>
            {archivo && (
              <button type="button" className="btn btn-primary" onClick={enviar}>
                Enviar evidencia
              </button>
            )}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          hidden
          accept={EXTENSIONES_PERMITIDAS.map((e) => `.${e}`).join(',')}
          onChange={(e) => {
            elegir(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
