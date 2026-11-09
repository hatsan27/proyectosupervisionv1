// Selector de destinatarios: todos los planteles o una selección (usado en avisos y solicitudes).
export default function DestinatariosSelector({
  alcance,
  onAlcance,
  seleccion,
  onAlternar,
  planteles,
  cargando,
  disabled,
  error,
}) {
  return (
    <fieldset className="form-field" style={{ border: 0, padding: 0, margin: '0 0 24px' }}>
      <legend className="form-label" style={{ fontSize: 12, fontWeight: 700, color: '#34474c', marginBottom: 9 }}>
        Destinatarios
      </legend>
      <div className="choice-group">
        <label className="choice">
          <input
            type="radio"
            name="alcance"
            value="todos"
            checked={alcance === 'todos'}
            onChange={() => onAlcance('todos')}
            disabled={disabled}
          />
          Todos los planteles
        </label>
        <label className="choice">
          <input
            type="radio"
            name="alcance"
            value="seleccion"
            checked={alcance === 'seleccion'}
            onChange={() => onAlcance('seleccion')}
            disabled={disabled}
          />
          Planteles específicos
        </label>
      </div>

      {alcance === 'seleccion' && (
        <div className="plantel-grid">
          {cargando && <span className="form-help">Cargando planteles…</span>}
          {!cargando && planteles.length === 0 && (
            <span className="form-help">No hay planteles registrados en la colección "planteles".</span>
          )}
          {planteles.map((p) => (
            <label key={p.id} className="choice">
              <input
                type="checkbox"
                checked={seleccion.includes(p.id)}
                onChange={() => onAlternar(p.id)}
                disabled={disabled}
              />
              {p.nombre ?? p.id}
            </label>
          ))}
        </div>
      )}
      {error && (
        <div className="form-help">
          <span className="form-error">{error}</span>
        </div>
      )}
    </fieldset>
  );
}
