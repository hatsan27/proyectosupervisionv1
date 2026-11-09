// P-09 · Formularios: listado para supervisión y para directoras (RF-08).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, FileSpreadsheet, Pencil, Plus, Trash2 } from 'lucide-react';
import PageHeading from '../components/ui/PageHeading';
import Alert from '../components/ui/Alert';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../constants/roles';
import { ESTADOS_FORMULARIO, ESTADO_FORMULARIO_LABELS } from '../constants/formularios';
import { eliminarFormulario, obtenerFormularios } from '../services/formulariosService';
import { obtenerRespuestas } from '../services/respuestasService';
import { formatoFecha } from '../utils/formatDate';
import { mensajeDeError } from '../utils/firebaseErrors';

const vencido = (f) => f.fechaLimite?.toMillis?.() < Date.now();

function EstadoForm({ estado }) {
  const clase = { borrador: 'status-pendiente', publicado: 'status-entregado', cerrado: 'status-aceptado' }[estado];
  return (
    <span className={`status ${clase}`}>
      <span className="status-dot" />
      {ESTADO_FORMULARIO_LABELS[estado]}
    </span>
  );
}

export default function FormulariosPage() {
  const { perfil } = useAuth();
  const location = useLocation();
  const esDirectora = perfil.rol === ROLES.DIRECTORA;
  const [formularios, setFormularios] = useState([]);
  const [respuestas, setRespuestas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [confirmar, setConfirmar] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const [f, r] = await Promise.all([obtenerFormularios(perfil), obtenerRespuestas(perfil)]);
      setFormularios(f);
      setRespuestas(r);
    } catch (e) {
      console.error('[formularios]', e);
      setError(
        e.code === 'failed-precondition'
          ? 'Falta crear un índice de Firestore para esta consulta. Ejecute npm run deploy:rules o use el enlace que aparece en la consola del navegador.'
          : mensajeDeError(e),
      );
    } finally {
      setCargando(false);
    }
  }, [perfil]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const respondidos = useMemo(() => {
    const m = {};
    respuestas.forEach((r) => {
      m[r.formularioId] = (m[r.formularioId] ?? 0) + 1;
    });
    return m;
  }, [respuestas]);

  const visibles = useMemo(() => {
    if (esDirectora) {
      if (filtro === 'pendientes') return formularios.filter((f) => !respondidos[f.id] && f.estado === ESTADOS_FORMULARIO.PUBLICADO);
      if (filtro === 'respondidos') return formularios.filter((f) => respondidos[f.id]);
      return formularios;
    }
    return filtro === 'todos' ? formularios : formularios.filter((f) => f.estado === filtro);
  }, [formularios, filtro, esDirectora, respondidos]);

  const filtros = esDirectora
    ? [{ id: 'todos', label: 'Todos' }, { id: 'pendientes', label: 'Por responder' }, { id: 'respondidos', label: 'Respondidos' }]
    : [{ id: 'todos', label: 'Todos' }, { id: 'borrador', label: 'Borradores' }, { id: 'publicado', label: 'Publicados' }, { id: 'cerrado', label: 'Cerrados' }];

  const borrar = async (id) => {
    try {
      await eliminarFormulario(id);
      setConfirmar(null);
      await cargar();
    } catch (e) {
      setError(mensajeDeError(e));
    }
  };

  return (
    <>
      <PageHeading
        eyebrow="P-09 · FORMULARIOS"
        titulo="Formularios"
        descripcion={
          esDirectora
            ? `Formularios que la Supervisión solicita a ${perfil.plantelNombre}.`
            : 'Diseñe formularios, publíquelos a los planteles y consulte sus concentrados.'
        }
      >
        {!esDirectora && (
          <Link to="/formularios/nuevo" className="btn btn-primary">
            <Plus size={17} aria-hidden="true" /> Nuevo formulario
          </Link>
        )}
      </PageHeading>

      {location.state?.mensaje && <Alert tipo="exito">{location.state.mensaje}</Alert>}
      {error && <Alert tipo="error">{error}</Alert>}

      <section className="surface-card requests-card">
        <div className="filter-pills" style={{ marginTop: 0 }}>
          {filtros.map((f) => (
            <button key={f.id} type="button" className={`filter-pill${filtro === f.id ? ' selected' : ''}`} onClick={() => setFiltro(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="table-wrap">
          <table className="request-table">
            <thead>
              <tr>
                <th>FORMULARIO</th>
                <th>FECHA LÍMITE</th>
                <th>{esDirectora ? 'SU RESPUESTA' : 'ESTADO'}</th>
                {!esDirectora && <th>RESPUESTAS</th>}
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {cargando && <tr><td colSpan={5} className="empty">Cargando formularios…</td></tr>}
              {!cargando && visibles.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty">
                    <FileSpreadsheet size={20} aria-hidden="true" style={{ display: 'block', margin: '0 auto 8px' }} />
                    No hay formularios en esta vista.
                  </td>
                </tr>
              )}
              {visibles.map((f) => {
                const respondido = Boolean(respondidos[f.id]);
                return (
                  <tr key={f.id}>
                    <td>
                      <strong>{f.titulo}</strong>
                      <span>{f.campos?.length ?? 0} campos{f.descripcion ? ` · ${f.descripcion.slice(0, 80)}` : ''}</span>
                    </td>
                    <td>
                      {formatoFecha(f.fechaLimite)}
                      {vencido(f) && f.estado === ESTADOS_FORMULARIO.PUBLICADO && (!esDirectora || !respondido) && <span className="due-late">Vencido</span>}
                    </td>
                    <td>
                      {esDirectora ? (
                        <>
                          <span className={`status ${respondido ? 'status-aceptado' : 'status-pendiente'}`}>
                            <span className="status-dot" />
                            {respondido ? 'Enviada' : 'Pendiente'}
                          </span>
                          {f.estado === ESTADOS_FORMULARIO.CERRADO && <span className="tag-closed">Cerrado</span>}
                        </>
                      ) : (
                        <EstadoForm estado={f.estado} />
                      )}
                    </td>
                    {!esDirectora && (
                      <td>{f.estado === ESTADOS_FORMULARIO.BORRADOR ? '—' : `${respondidos[f.id] ?? 0}/${f.plantelIds.length}`}</td>
                    )}
                    <td className="row-actions">
                      {esDirectora ? (
                        <Link to={`/formularios/${f.id}/responder`} className="btn btn-outline btn-sm">
                          {f.estado === ESTADOS_FORMULARIO.PUBLICADO ? (respondido ? 'Ver o modificar' : 'Responder') : 'Ver'}
                        </Link>
                      ) : f.estado === ESTADOS_FORMULARIO.BORRADOR ? (
                        <>
                          <Link to={`/formularios/${f.id}/editar`} className="btn btn-outline btn-sm">
                            <Pencil size={14} aria-hidden="true" /> Editar
                          </Link>
                          {confirmar === f.id ? (
                            <>
                              <button type="button" className="btn btn-warn btn-sm" onClick={() => borrar(f.id)}>Eliminar</button>
                              <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirmar(null)}>No</button>
                            </>
                          ) : (
                            <button type="button" className="btn btn-outline btn-sm btn-icon-danger" aria-label="Eliminar borrador" onClick={() => setConfirmar(f.id)}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </>
                      ) : (
                        <Link to={`/formularios/${f.id}/concentrado`} className="btn btn-outline btn-sm">
                          <BarChart3 size={14} aria-hidden="true" /> Concentrado
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
