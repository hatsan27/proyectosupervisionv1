// Navegación horizontal visible solo en celular.
import { NavLink } from 'react-router-dom';
import { navParaRol } from '../../constants/navigation';
import { useAuth } from '../../hooks/useAuth';

export default function MobileNav() {
  const { perfil } = useAuth();
  return (
    <nav className="mobile-nav" aria-label="Navegación rápida">
      {navParaRol(perfil.rol)
        .filter((item) => !item.pronto)
        .map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/panel'}
            className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}
          >
            {label}
          </NavLink>
        ))}
    </nav>
  );
}
