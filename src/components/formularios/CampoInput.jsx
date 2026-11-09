// Muestra un campo del formulario para capturarlo (o en vista previa).
import { Plus, Trash2 } from 'lucide-react';
import { MAX_TEXTO } from '../../constants/formularios';

function TablaInput({ campo, valor = [], onChange, disabled }) {
  const filas = valor.length ? valor : [{}];
  const cambiar = (i, col, v) => onChange(filas.map((f, j) => (j === i ? { ...f, [col]: v } : f)));
  return (
    <div className="table-wrap">
      <table className="field-table">
        <thead>
          <tr>
            {campo.columnas.map((c, i) => (
              <th key={i}>{c || `Columna ${i + 1}`}</th>
            ))}
            {!disabled && <th aria-label="Quitar" />}
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => (
            <tr key={i}>
              {campo.columnas.map((_, ci) => (
                <td key={ci}>
                  <input
                    type="text"
                    value={f[`c${ci}`] ?? ''}
                    disabled={disabled}
                    aria-label={`${campo.columnas[ci]} fila ${i + 1}`}
                    onChange={(e) => cambiar(i, `c${ci}`, e.target.value)}
                  />
                </td>
              ))}
              {!disabled && (
                <td className="field-table-x">
                  <button type="button" className="icon-btn" aria-label="Quitar fila" onClick={() => onChange(filas.filter((_, j) => j !== i))}>
                    <Trash2 size={14} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!disabled && (
        <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: 8 }} onClick={() => onChange([...filas, {}])}>
          <Plus size={14} aria-hidden="true" /> Agregar fila
        </button>
      )}
    </div>
  );
}

export default function CampoInput({ campo, valor, onChange, disabled = false, error }) {
  const id = `campo-${campo.id}`;
  let control;
  switch (campo.tipo) {
    case 'numero':
      control = (
        <input id={id} type="number" inputMode="decimal" value={valor ?? ''} disabled={disabled}
          min={campo.min} max={campo.max} onChange={(e) => onChange(e.target.value)} />
      );
      break;
    case 'fecha':
      control = <input id={id} type="date" value={valor ?? ''} disabled={disabled} onChange={(e) => onChange(e.target.value)} />;
      break;
    case 'opcion':
      control = (
        <div className="choice-group">
          {(campo.opciones ?? []).filter(Boolean).map((o) => (
            <label key={o} className="choice">
              <input type="radio" name={id} checked={valor === o} disabled={disabled} onChange={() => onChange(o)} />
              {o}
            </label>
          ))}
        </div>
      );
      break;
    case 'tabla':
      control = <TablaInput campo={campo} valor={valor} onChange={onChange} disabled={disabled} />;
      break;
    default:
      control = (
        <textarea id={id} rows={2} maxLength={MAX_TEXTO} value={valor ?? ''} disabled={disabled}
          style={{ minHeight: 70 }} onChange={(e) => onChange(e.target.value)} />
      );
  }
  return (
    <div className="form-field">
      <label htmlFor={id}>
        {campo.etiqueta || 'Pregunta sin título'}
        {campo.requerido && <span className="req-mark"> *</span>}
      </label>
      {control}
      {error && (
        <div className="form-help">
          <span className="form-error">{error}</span>
        </div>
      )}
    </div>
  );
}
