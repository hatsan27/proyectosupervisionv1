import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import PanelPage from './pages/PanelPage';
import AvisosPage from './pages/AvisosPage';
import AvisoDetallePage from './pages/AvisoDetallePage';
import NuevoAvisoPage from './pages/NuevoAvisoPage';
import SolicitudesPage from './pages/SolicitudesPage';
import NuevaSolicitudPage from './pages/NuevaSolicitudPage';
import SolicitudDetallePage from './pages/SolicitudDetallePage';
import FormatosPage from './pages/FormatosPage';
import NuevoFormatoPage from './pages/NuevoFormatoPage';
import FormulariosPage from './pages/FormulariosPage';
import ConstructorFormularioPage from './pages/ConstructorFormularioPage';
import ResponderFormularioPage from './pages/ResponderFormularioPage';
import ConcentradoPage from './pages/ConcentradoPage';
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

          {/* Actividad 9 · Solicitudes y evidencias */}
          <Route path="/solicitudes" element={<SolicitudesPage />} />                 {/* P-05 */}
          <Route element={<RoleRoute roles={[ROLES.SUPERVISORA, ROLES.ADMINISTRATIVA]} />}>
            <Route path="/solicitudes/nueva" element={<NuevaSolicitudPage />} />
          </Route>
          <Route path="/solicitudes/:solicitudId" element={<SolicitudDetallePage />} /> {/* P-06 y P-07 */}

          {/* Actividad 10 · Banco de formatos */}
          <Route path="/formatos" element={<FormatosPage />} />                       {/* P-08 */}
          <Route element={<RoleRoute roles={[ROLES.SUPERVISORA, ROLES.ADMINISTRATIVA]} />}>
            <Route path="/formatos/nuevo" element={<NuevoFormatoPage />} />
            <Route path="/formatos/:formatoId/editar" element={<NuevoFormatoPage />} />
          </Route>

          {/* Actividades 11 y 12 · Formularios, concentrados y exportación */}
          <Route path="/formularios" element={<FormulariosPage />} />                 {/* P-09 */}
          <Route element={<RoleRoute roles={[ROLES.SUPERVISORA, ROLES.ADMINISTRATIVA]} />}>
            <Route path="/formularios/nuevo" element={<ConstructorFormularioPage />} />
            <Route path="/formularios/:formularioId/editar" element={<ConstructorFormularioPage />} />
            <Route path="/formularios/:formularioId/concentrado" element={<ConcentradoPage />} />
          </Route>
          <Route element={<RoleRoute roles={[ROLES.DIRECTORA]} />}>
            <Route path="/formularios/:formularioId/responder" element={<ResponderFormularioPage />} />
          </Route>

          <Route path="*" element={<NoEncontradaPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
