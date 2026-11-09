// Editor de un campo dentro del constructor de formularios.
import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react';
import { TIPO_LABELS } from '../../constants/formularios';

function ListaEditable({ titulo, valores, onChange, placeholder }) {
  return (
    <div className="list-edit">
      <span className="form-label">{titulo}</span>
      {valores.map((v, i) => (
        <div key={i} className="list-edit-row">
          <input type="text" value={v} placeholder={`${placeholder} ${i + 1}`} maxLength={80}
            onChange={(e) => onChange(valores.map((x, j) => (j === i ? e.target.value : x)))} />
          <button type="button" className="icon-btn" aria-label="Quitar" disabled={valores.length <= 1}
            onClick={() => onChange(valores.filter((_, j) => j !== i))}>
            <X size={14} />
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-outline btn-sm" onClick={() => onChange([...valores, ''])}>
        <Plus size={14} aria-hidden="true" /> Agregar
      </button>
    </div>
  );
}

export default function CampoEditor({ campo, indice, total, onChange, onMover, onEliminar, error }) {
  const set = (cambios) => onChange({ ...campo, ...cambios });
  return (
    <div className={`field-editor${error ? ' field-editor-error' : ''}`}>
      <div className="field-editor-head">
        <span className="field-type">{indice + 1}. {TIPO_LABELS[campo.tipo]}</span>
        <div className="field-editor-tools">
          <button type="button" className="icon-btn" aria-label="Subir" disabled={indice === 0} onClick={() => onMover(-1)}><ArrowUp size={15} /></button>
          <button type="button" className="icon-btn" aria-label="Bajar" disabled={indice === total - 1} onClick={() => onMover(1)}><ArrowDown size={15} /></button>
          <button type="button" className="icon-btn icon-btn-danger" aria-label="Eliminar campo" onClick={onEliminar}><Trash2 size={15} /></button>
        </div>
      </div>

      <div className="form-field" style={{ marginBottom: 12 }}>
        <label htmlFor={`et-${campo.id}`}>Pregunta</label>
        <input id={`et-${campo.id}`} type="text" maxLength={200} value={campo.etiqueta}
          placeholder="Ej. Total de alumnos inscritos" onChange={(e) => set({ etiqueta: e.target.value })} />
      </div>

      {campo.tipo === 'opcion' && (
        <ListaEditable titulo="Opciones" valores={campo.opciones ?? []} placeholder="Opción" onChange={(opciones) => set({ opciones })} />
      )}
      {campo.tipo === 'tabla' && (
        <ListaEditable titulo="Columnas" valores={campo.columnas ?? []} placeholder="Columna" onChange={(columnas) => set({ columnas })} />
      )}
      {campo.tipo === 'numero' && (
        <div className="min-max">
          <label>Mínimo <input type="number" value={campo.min ?? ''} onChange={(e) => set({ min: e.target.value })} /></label>
          <label>Máximo <input type="number" value={campo.max ?? ''} onChange={(e) => set({ max: e.target.value })} /></label>
        </div>
      )}

      <label className="toggle" style={{ marginTop: 10 }}>
        <input type="checkbox" checked={campo.requerido} onChange={(e) => set({ requerido: e.target.checked })} />
        Respuesta obligatoria
      </label>
      {error && <div className="form-help"><span className="form-error">{error}</span></div>}
    </div>
  );
}
