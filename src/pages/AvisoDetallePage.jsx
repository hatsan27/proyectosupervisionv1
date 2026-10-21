// P-03 · Lectura completa de un aviso.
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Lock, SearchX } from 'lucide-react';
import Loader from '../components/ui/Loader';
import EmptyState from '../components/ui/EmptyState';
import { obtenerAviso } from '../services/avisosService';
import { usePlanteles } from '../hooks/usePlanteles';
import { formatoFechaHora } from '../utils/formatDate';
import { textoDestinatarios } from '../components/avisos/destinatarios';
import { DESTINO_TODOS } from '../constants/roles';

export default function AvisoDetallePage() {
  const { avisoId } = useParams();
  const { nombres } = usePlanteles();
  const [aviso, setAviso] = useState(null);
  const [estado, setEstado] = useState('cargando'); // cargando | listo | no-existe | sin-permiso | error

  useEffect(() => {
    let activo = true;
    setEstado('cargando');
    obtenerAviso(avisoId)
      .then((datos) => {
        if (!activo) return;
        setAviso(datos);
        setEstado(datos ? 'listo' : 'no-existe');
      })
      .catch((e) => {
        if (!activo) return;
        // Las reglas de Firestore niegan la lectura de avisos de otros planteles.
        setEstado(e.code === 'permission-denied' ? 'sin-permiso' : 'error');
      });
    return () => {
      activo = false;
    };
  }, [avisoId]);

  const volver = (
    <Link to="/avisos" className="back-link">
      <ArrowLeft size={16} aria-hidden="true" /> Volver a avisos
    </Link>
  );

  if (estado === 'cargando') return <Loader texto="Abriendo aviso…" />;

  if (estado !== 'listo') {
    const sinPermiso = estado === 'sin-permiso';
    return (
      <>
        {volver}
        <EmptyState icono={sinPermiso ? Lock : SearchX} titulo={sinPermiso ? 'Aviso no disponible para su plantel' : 'Aviso no encontrado'}>
          <p>
            {sinPermiso
              ? 'Este comunicado está dirigido a otro plantel, por lo que no puede consultarse desde su cuenta.'
              : 'El aviso no existe o fue retirado.'}
          </p>
        </EmptyState>
      </>
    );
  }

  const general = aviso.destinatarios?.includes(DESTINO_TODOS);
  const listaDestinos = general
    ? 'Todos los planteles'
    : aviso.destinatarios.map((id) => nombres[id] ?? id).join(', ');

  return (
    <>
      {volver}
      <article className="surface-card aviso-detalle">
        <div className="notice-meta">
          <span className="type-badge">{general ? 'General' : 'Dirigido'}</span>
          <span>{formatoFechaHora(aviso.publicadoEn)}</span>
          <span className="meta-dot">·</span>
          <span>{textoDestinatarios(aviso.destinatarios, nombres)}</span>
        </div>
        <h1>{aviso.titulo}</h1>
        <div className="aviso-cuerpo">{aviso.contenido}</div>
        <div className="aviso-pie">
          {aviso.autorNombre && <span>Publicado por: {aviso.autorNombre}</span>}
          <span>Destinatarios: {listaDestinos}</span>
        </div>
      </article>
    </>
  );
}
