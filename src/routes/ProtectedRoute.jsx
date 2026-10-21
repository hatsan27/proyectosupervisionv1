// Bloquea las pantallas protegidas cuando no hay sesión (Anexo 7, "Sesión cerrada").
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/ui/Loader';

export default function ProtectedRoute() {
  const { estado, salidaVoluntaria } = useAuth();
  const location = useLocation();

  if (estado === 'cargando') return <Loader pantallaCompleta texto="Verificando sesión…" />;
  if (estado !== 'autenticado') {
    // Se recuerda la página solicitada solo si no fue un cierre de sesión voluntario.
    return <Navigate to="/login" replace state={salidaVoluntaria ? null : { desde: location.pathname }} />;
  }

  return <Outlet />;
}
