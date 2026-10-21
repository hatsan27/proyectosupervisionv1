// P-05 a P-09 · Módulos programados para actividades posteriores del cronograma.
import { Link } from 'react-router-dom';
import { Hourglass } from 'lucide-react';
import PageHeading from '../components/ui/PageHeading';
import EmptyState from '../components/ui/EmptyState';
import { MODULOS_PENDIENTES } from '../constants/navigation';

export default function ProximamentePage({ modulo }) {
  const info = MODULOS_PENDIENTES[modulo];
  return (
    <>
      <PageHeading eyebrow={`ACTIVIDAD ${info.actividad} DEL CRONOGRAMA`} titulo={info.titulo} />
      <EmptyState icono={Hourglass} titulo="Módulo en desarrollo">
        <p>{info.descripcion}</p>
        <Link to="/panel" className="btn btn-outline">
          Volver al panel
        </Link>
      </EmptyState>
    </>
  );
}
