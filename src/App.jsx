import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import PanelPage from './pages/PanelPage';
import AvisosPage from './pages/AvisosPage';
import AvisoDetallePage from './pages/AvisoDetallePage';
import NuevoAvisoPage from './pages/NuevoAvisoPage';
import ProximamentePage from './pages/ProximamentePage';
import NoEncontradaPage from './pages/NoEncontradaPage';
import { ROLES } from './constants/roles';

// Mapa de rutas · claves de pantalla del Anexo 3
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />                     {/* P-01 */}

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/panel" replace />} />
          <Route path="/panel" element={<PanelPage />} />                   {/* P-02 */}
          <Route path="/avisos" element={<AvisosPage />} />                 {/* P-03 */}
          <Route element={<RoleRoute roles={[ROLES.SUPERVISORA]} />}>
            <Route path="/avisos/nuevo" element={<NuevoAvisoPage />} />     {/* P-04 */}
          </Route>
          <Route path="/avisos/:avisoId" element={<AvisoDetallePage />} />  {/* P-03 lectura */}

          {/* Módulos de actividades posteriores (9 a 11) */}
          <Route path="/solicitudes" element={<ProximamentePage modulo="solicitudes" />} />
          <Route path="/formatos" element={<ProximamentePage modulo="formatos" />} />
          <Route path="/formularios" element={<ProximamentePage modulo="formularios" />} />

          <Route path="*" element={<NoEncontradaPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
