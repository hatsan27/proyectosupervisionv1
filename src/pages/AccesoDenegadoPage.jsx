// Se muestra cuando un perfil intenta abrir una pantalla que no le corresponde.
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';

export default function AccesoDenegadoPage() {
  return (
    <EmptyState icono={ShieldAlert} titulo="Acceso no permitido">
      <p>Su perfil no tiene autorización para abrir esta sección. Si cree que es un error, comuníquese con la Supervisión.</p>
      <Link to="/panel" className="btn btn-primary">
        Ir al panel principal
      </Link>
    </EmptyState>
  );
}
