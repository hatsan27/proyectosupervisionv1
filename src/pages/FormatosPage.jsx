// P-08 · Banco de formatos (RF-07).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Archive, ArchiveRestore, FileText, FolderOpen, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import PageHeading from '../components/ui/PageHeading';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import BotonDescarga from '../components/solicitudes/BotonDescarga';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../constants/roles';
import { CATEGORIAS, CATEGORIA_LABELS } from '../constants/categorias';
import { cambiarVigencia, eliminarFormato, obtenerFormatos } from '../services/formatosService';
import { formatoFecha } from '../utils/formatDate';
import { mensajeDeError } from '../utils/firebaseErrors';

const normalizar = (t = '') => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function FormatosPage() {
  const { perfil } = useAuth();
  const location = useLocation();
  const esSupervision = perfil.rol !== ROLES.DIRECTORA;
  const esSupervisora = perfil.rol === ROLES.SUPERVISORA;

  const [formatos, setFormatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState(location.state?.guardado ? 'El formato se guardó correctamente.' : '');
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('todas');
  const [verRetirados, setVerRetirados] = useState(false);
  const [confirmarBorrado, setConfirmarBorrado] = useState(null);
  const [ocupado, setOcupado] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      setFormatos(await obtenerFormatos(perfil));
    } catch (e) {
      console.error('[formatos]', e);
      setError(mensajeDeError(e));
    } finally {
      setCargando(false);
    }
  }, [perfil]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim());
    return formatos.filter(
      (f) =>
        (verRetirados || f.vigente) &&
        (categoria === 'todas' || f.categoria === categoria) &&
        (!q || normalizar(`${f.titulo} ${f.descripcion}`).includes(q)),
    );
  }, [formatos, busqueda, categoria, verRetirados]);

  // Agrupados por categoría, en el orden del catálogo.
  const grupos = useMemo(
    () => CATEGORIAS.map((c) => ({ ...c, items: visibles.filter((f) => f.categoria === c.id) })).filter((g) => g.items.length),
    [visibles],
  );

  const accion = async (id, fn, mensaje) => {
    setError('');
    setAviso('');
    setOcupado(id);
    try {
      await fn();
      setAviso(mensaje);
      await cargar();
    } catch (e) {
      console.error('[formatos]', e);
      setError(mensajeDeError(e));
    } finally {
      setOcupado(null);
      setConfirmarBorrado(null);
    }
  };

  return (
    <>
      <PageHeading
        eyebrow="P-08 · BANCO DE FORMATOS"
        titulo="Banco de formatos"
        descripcion="Formatos vigentes de la Zona Escolar 072 para consulta y descarga."
      >
        {esSupervision && (
          <Link to="/formatos/nuevo" className="btn btn-primary">
            <Plus size={17} aria-hidden="true" /> Publicar formato
          </Link>
        )}
      </PageHeading>

      {aviso && <Alert tipo="exito">{aviso}</Alert>}
      {error && <Alert tipo="error">{error}</Alert>}

      <div className="filter-row">
        <label className="search-visual">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar formato por nombre"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar formatos"
          />
        </label>
        {esSupervision && (
          <label className="toggle">
            <input type="checkbox" checked={verRetirados} onChange={(e) => setVerRetirados(e.target.checked)} />
            Mostrar retirados
          </label>
        )}
      </div>

      <div className="filter-pills" style={{ marginTop: 0 }}>
        {[{ id: 'todas', label: 'Todas' }, ...CATEGORIAS].map((c) => (
          <button
            key={c.id}
            type="button"
            className={`filter-pill${categoria === c.id ? ' selected' : ''}`}
            onClick={() => setCategoria(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {cargando && <div className="empty">Cargando formatos…</div>}
      {!cargando && grupos.length === 0 && (
        <EmptyState icono={FolderOpen} titulo={busqueda ? 'Sin resultados' : 'Aún no hay formatos'}>
          <p>{busqueda ? 'No se encontraron formatos con ese nombre.' : 'Cuando la Supervisión publique formatos aparecerán aquí.'}</p>
        </EmptyState>
      )}

      {grupos.map((g) => (
        <section key={g.id} className="format-group">
          <h2 className="format-group-title">
            {g.label} <span>{g.items.length}</span>
          </h2>
          <div className="format-list">
            {g.items.map((f) => (
              <article key={f.id} className={`surface-card format-card${f.vigente ? '' : ' format-retired'}`}>
                <div className="notice-icon">
                  <FileText size={20} aria-hidden="true" />
                </div>
                <div className="format-main">
                  <div className="notice-meta">
                    <span className="type-badge">{CATEGORIA_LABELS[f.categoria]}</span>
                    <span>Actualizado el {formatoFecha(f.actualizadoEn)}</span>
                    {!f.vigente && <span className="tag-closed">Retirado</span>}
                  </div>
                  <h3>{f.titulo}</h3>
                  {f.descripcion && <p>{f.descripcion}</p>}
                  <div className="format-actions">
                    <BotonDescarga archivo={f.archivo} />
                    {esSupervision && (
                      <>
                        <Link to={`/formatos/${f.id}/editar`} className="btn btn-outline btn-sm">
                          <Pencil size={14} aria-hidden="true" /> Editar o sustituir
                        </Link>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          disabled={ocupado === f.id}
                          onClick={() =>
                            accion(f.id, () => cambiarVigencia(f.id, !f.vigente), f.vigente ? 'El formato se retiró.' : 'El formato está vigente de nuevo.')
                          }
                        >
                          {f.vigente ? <Archive size={14} aria-hidden="true" /> : <ArchiveRestore size={14} aria-hidden="true" />}
                          {f.vigente ? 'Retirar' : 'Reactivar'}
                        </button>
                      </>
                    )}
                    {esSupervisora &&
                      (confirmarBorrado === f.id ? (
                        <span className="confirm-inline">
                          ¿Eliminar definitivamente?
                          <button type="button" className="btn btn-warn btn-sm" disabled={ocupado === f.id} onClick={() => accion(f.id, () => eliminarFormato(f), 'El formato se eliminó.')}>
                            Sí, eliminar
                          </button>
                          <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirmarBorrado(null)}>
                            No
                          </button>
                        </span>
                      ) : (
                        <button type="button" className="btn btn-outline btn-sm btn-icon-danger" onClick={() => setConfirmarBorrado(f.id)} aria-label={`Eliminar ${f.titulo}`}>
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
