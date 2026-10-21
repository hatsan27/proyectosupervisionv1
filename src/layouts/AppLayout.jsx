// Estructura común de las pantallas autenticadas (P-02 en adelante).
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import MobileNav from '../components/layout/MobileNav';
import Footer from '../components/layout/Footer';

export default function AppLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const cerrarMenu = () => setMenuAbierto(false);

  return (
    <div className="app-shell">
      <Sidebar abierta={menuAbierto} onNavegar={cerrarMenu} />
      {menuAbierto && (
        <button type="button" className="mobile-backdrop" aria-label="Cerrar menú" onClick={cerrarMenu} />
      )}

      <div className="app-content">
        <Topbar onAbrirMenu={() => setMenuAbierto(true)} />
        <MobileNav />
        <main className="main-content">
          <Outlet />
          <Footer />
        </main>
      </div>
    </div>
  );
}
