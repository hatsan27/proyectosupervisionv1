import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const ICONOS = { info: Info, error: AlertCircle, exito: CheckCircle2 };

// Mensaje visible de estado (Anexo 5: "los estados de interacción se presentan mediante mensajes visibles").
export default function Alert({ tipo = 'info', children }) {
  const Icono = ICONOS[tipo] ?? Info;
  return (
    <div className={`alert alert-${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      <Icono size={17} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
