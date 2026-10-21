import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';

export default function NoEncontradaPage() {
  return (
    <EmptyState icono={SearchX} titulo="Página no encontrada">
      <p>La dirección que abrió no existe dentro de la plataforma.</p>
      <Link to="/panel" className="btn btn-primary">
        Ir al panel principal
      </Link>
    </EmptyState>
  );
}
