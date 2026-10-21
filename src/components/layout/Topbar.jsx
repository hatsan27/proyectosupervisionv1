import { Menu } from 'lucide-react';
import { ROLE_LABELS } from '../../constants/roles';
import { useAuth } from '../../hooks/useAuth';

const iniciales = (nombre = '') =>
  nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || '?';

export default function Topbar({ onAbrirMenu }) {
  const { perfil } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-start">
        <button type="button" className="hamburger" onClick={onAbrirMenu} aria-label="Abrir menú">
          <Menu size={22} />
        </button>
        <div className="topbar-location">
          <span className="topbar-dot" />
          {perfil.plantelNombre ?? 'Zona Escolar 072'}
        </div>
      </div>

      <div className="topbar-actions">
        <div className="topbar-role">
          <span className="role-label">Sesión iniciada como</span>
          <strong>{ROLE_LABELS[perfil.rol]}</strong>
        </div>
        <div className="avatar" title={perfil.nombre}>
          {iniciales(perfil.nombre)}
        </div>
      </div>
    </header>
  );
}
