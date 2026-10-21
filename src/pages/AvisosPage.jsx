// P-03 · Listado de avisos (RF-03, RF-10)
import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Lock, Megaphone, Plus, Search } from 'lucide-react';
import PageHeading from '../components/ui/PageHeading';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import AvisoCard from '../components/avisos/AvisoCard';
import { useAuth } from '../hooks/useAuth';
import { useAvisos } from '../hooks/useAvisos';
import { usePlanteles } from '../hooks/usePlanteles';
import { ROLES } from '../constants/roles';
import { mensajeDeError } from '../utils/firebaseErrors';

const normalizar = (t = '') => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function AvisosPage() {
  const { perfil } = useAuth();
  const { avisos, cargando, error } = useAvisos();
  const { nombres } = usePlanteles();
  const location = useLocation();
  const [busqueda, setBusqueda] = useState('');

  const puedePublicar = perfil.rol === ROLES.SUPERVISORA;
  const avisoPublicado = location.state?.publicado;

  const filtrados = useMemo(() => {
    const q = normalizar(busqueda.trim());
    if (!q) return avisos;
    return avisos.filter((a) => normalizar(`${a.titulo} ${a.contenido}`).includes(q));
  }, [avisos, busqueda]);

  return (
    <>
      <PageHeading
        eyebrow="P-03 · COMUNICADOS"
        titulo="Avisos"
        descripcion={
          perfil.rol === ROLES.DIRECTORA
            ? `Avisos generales y dirigidos a ${perfil.plantelNombre}.`
            : 'Comunicados publicados por la Supervisión para los planteles de la zona.'
        }
      >
        <span className="page-chip">
          <Megaphone size={15} aria-hidden="true" /> {cargando ? '…' : avisos.length} avisos
        </span>
      </PageHeading>

      {avisoPublicado && <Alert tipo="exito">El aviso se publicó correctamente.</Alert>}
      {error && <Alert tipo="error">{mensajeDeError(error)}</Alert>}

      <div className="filter-row">
        <label className="search-visual">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar por título o contenido"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar avisos"
          />
        </label>

        {puedePublicar ? (
          <Link to="/avisos/nuevo" className="btn btn-primary">
            <Plus size={17} aria-hidden="true" /> Nuevo aviso
          </Link>
        ) : (
          <span className="disabled-action">
            <Lock size={14} aria-hidden="true" /> Solo la supervisora publica avisos
          </span>
        )}
      </div>

      {cargando && <div className="empty">Cargando avisos…</div>}

      {!cargando && !error && filtrados.length === 0 && (
        <EmptyState icono={Megaphone} titulo={busqueda ? 'Sin resultados' : 'No hay avisos por ahora'}>
          <p>
            {busqueda
              ? 'No se encontraron avisos con ese texto.'
              : 'Cuando la Supervisión publique un aviso aparecerá en esta sección.'}
          </p>
        </EmptyState>
      )}

      <div className="notices-list">
        {filtrados.map((aviso) => (
          <AvisoCard key={aviso.id} aviso={aviso} nombresPlanteles={nombres} />
        ))}
      </div>
    </>
  );
}
