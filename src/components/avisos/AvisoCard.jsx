import { Link } from 'react-router-dom';
import { ChevronRight, Megaphone } from 'lucide-react';
import { formatoFecha } from '../../utils/formatDate';
import { textoDestinatarios } from './destinatarios';
import { DESTINO_TODOS } from '../../constants/roles';

const resumen = (texto = '', max = 220) => (texto.length > max ? `${texto.slice(0, max).trimEnd()}…` : texto);

export default function AvisoCard({ aviso, nombresPlanteles }) {
  const general = aviso.destinatarios?.includes(DESTINO_TODOS);

  return (
    <Link to={`/avisos/${aviso.id}`} className="surface-card notice-card">
      <div className="notice-left">
        <div className="notice-icon">
          <Megaphone size={21} aria-hidden="true" />
        </div>
        <div className="notice-content">
          <div className="notice-meta">
            <span className="type-badge">{general ? 'General' : 'Dirigido'}</span>
            <span>{formatoFecha(aviso.publicadoEn)}</span>
            <span className="meta-dot">·</span>
            <span>{textoDestinatarios(aviso.destinatarios, nombresPlanteles)}</span>
          </div>
          <h2>{aviso.titulo}</h2>
          <p>{resumen(aviso.contenido)}</p>
          {aviso.autorNombre && <span className="notice-code">Publicado por {aviso.autorNombre}</span>}
        </div>
      </div>
      <ChevronRight className="notice-end" size={20} aria-hidden="true" />
    </Link>
  );
}
