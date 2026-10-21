// Restringe una ruta a ciertos roles. Si el perfil no está autorizado
// se muestra la pantalla de acceso no permitido (Anexo 7, Figura 5).
import { Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AccesoDenegadoPage from '../pages/AccesoDenegadoPage';

export default function RoleRoute({ roles }) {
  const { perfil } = useAuth();
  if (!perfil || !roles.includes(perfil.rol)) return <AccesoDenegadoPage />;
  return <Outlet />;
}
