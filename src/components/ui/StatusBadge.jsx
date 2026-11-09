import { ESTADO_LABELS } from '../../constants/estados';

// Etiqueta de estado: pendiente, entregado, corrección o aceptado (estilos en solicitudes/dashboard).
export default function StatusBadge({ estado }) {
  return (
    <span className={`status status-${estado}`}>
      <span className="status-dot" />
      {ESTADO_LABELS[estado] ?? estado}
    </span>
  );
}
