// Selector de archivo con validación y barra de progreso (usado en formatos).
import { useRef } from 'react';
import { FileUp } from 'lucide-react';
import { formatoTamano } from '../../services/storageService';

export default function SelectorArchivo({ archivo, onElegir, extensiones, progreso, disabled, ayuda }) {
  const inputRef = useRef(null);
  return (
    <div className="file-picker">
      <button type="button" className="btn btn-outline" onClick={() => inputRef.current?.click()} disabled={disabled}>
        <FileUp size={16} aria-hidden="true" /> {archivo ? 'Elegir otro archivo' : 'Elegir archivo'}
      </button>
      <span className="file-picker-name">
        {archivo ? `${archivo.name} · ${formatoTamano(archivo.size)}` : ayuda}
      </span>
      {progreso !== null && progreso !== undefined && (
        <div className="upload-progress" style={{ margin: '10px 0 0', maxWidth: 'none', flexBasis: '100%' }}>
          <div style={{ width: `${progreso}%` }} />
          <span>Subiendo… {progreso}%</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={extensiones.map((e) => `.${e}`).join(',')}
        onChange={(e) => {
          onElegir(e.target.files?.[0] ?? null);
          e.target.value = '';
        }}
      />
    </div>
  );
}
