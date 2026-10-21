import { NavLink } from 'react-router-dom';
import { LogOut, ShieldCheck } from 'lucide-react';
import Brand from '../ui/Brand';
import { navParaRol } from '../../constants/navigation';
import { ROLE_LABELS } from '../../constants/roles';
import { useAuth } from '../../hooks/useAuth';

export default function Sidebar({ abierta, onNavegar }) {
  const { perfil, salir } = useAuth();
  const items = navParaRol(perfil.rol);

  return (
    <aside className={`sidebar${abierta ? ' sidebar-open' : ''}`} aria-label="Menú principal">
      <div className="sidebar-brand">
        <Brand inverse small />
      </div>

      <div className="sidebar-section-title">MENÚ</div>
      <nav>
        {items.map(({ to, label, icon: Icono, pronto }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/panel'}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            onClick={onNavegar}
          >
            {({ isActive }) => (
              <>
                <Icono size={18} aria-hidden="true" />
                <span>{label}</span>
                {pronto && <span className="nav-soon">Pronto</span>}
                {isActive && <span className="nav-active-mark" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-spacer" />

      <div className="sidebar-bottom">
        <div className="sidebar-mini">
          <span className="sidebar-mini-icon">
            <ShieldCheck size={16} aria-hidden="true" />
          </span>
          <div>
            {perfil.nombre}
            <br />
            <small>
              {ROLE_LABELS[perfil.rol]}
              {perfil.plantelNombre ? ` · ${perfil.plantelNombre}` : ''}
            </small>
          </div>
        </div>
        <button type="button" className="sidebar-exit" onClick={salir}>
          <LogOut size={16} aria-hidden="true" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
