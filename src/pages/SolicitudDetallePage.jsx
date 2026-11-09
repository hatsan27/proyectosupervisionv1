// P-06 · Detalle de solicitud y P-07 · Carga (directora) o revisión (supervisión) de evidencias.
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Info, Lock, LockOpen, SearchX } from 'lucide-react';
import Loader from '../components/ui/Loader';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import SubirEvidencia from '../components/solicitudes/SubirEvidencia';
import RevisionEntrega from '../components/solicitudes/RevisionEntrega';
import BotonDescarga from '../components/solicitudes/BotonDescarga';
import { useAuth } from '../hooks/useAuth';
import { usePlanteles } from '../hooks/usePlanteles';
import { cambiarEstadoSolicitud, estaVencida, obtenerSolicitud } from '../services/solicitudesService';
import { obtenerEntregasDeSolicitud } from '../services/entregasService';
import { ROLES } from '../constants/roles';
import { ESTADOS, SOLICITUD_ABIERTA, SOLICITUD_CERRADA } from '../constants/estados';
import { formatoFecha, formatoFechaHora } from '../utils/formatDate';
import { mensajeDeError } from '../utils/firebaseErrors';

const fueraDePlazo = (entrega, solicitud) =>
  entrega?.enviadoEn?.toMillis?.() > solicitud.fechaLimite.toMillis();

function Encabezado({ solicitud, children }) {
  return (
    <>
      <div className="eyebrow">P-06 · DETALLE DE SOLICITUD</div>
      <h2>{solicitud.titulo}</h2>
      <p className="evidence-description" style={{ whiteSpace: 'pre-wrap' }}>
        {solicitud.descripcion || 'Sin instrucciones adicionales.'}
      </p>
      <div className="detail-grid">
        <div>
          <span>Fecha límite</span>
          <strong>
            {formatoFecha(solicitud.fechaLimite)}
            {estaVencida(solicitud) && solicitud.estado === SOLICITUD_ABIERTA && <span className="due-late">Vencida</span>}
          </strong>
        </div>
        {children}
        <div>
          <span>Solicitada por</span>
          <strong>{solicitud.autorNombre || 'Supervisión Escolar 072'}</strong>
        </div>
        <div>
          <span>Fecha de solicitud</span>
          <strong>{formatoFecha(solicitud.creadoEn)}</strong>
        </div>
      </div>
    </>
  );
}

// ---------- Vista de la directora: enviar evidencia ----------
function VistaDirectora({ solicitud, entrega, perfil, onCambio }) {
  const estado = entrega?.estado ?? ESTADOS.PENDIENTE;
  const abierta = solicitud.estado === SOLICITUD_ABIERTA;
  const puedeEnviar = abierta && estado !== ESTADOS.ACEPTADO;
  const paso = { pendiente: 2, correccion: 2, entregado: 3, aceptado: 4 }[estado];

  return (
    <div className="evidence-grid">
      <section className="surface-card evidence-main">
        <Encabezado solicitud={solicitud}>
          <div>
            <span>Estado de su entrega</span>
            <StatusBadge estado={estado} />
          </div>
        </Encabezado>

        <h3 className="section-title">Su entrega</h3>

        {estado === ESTADOS.CORRECCION && (
          <div className="review-step">
            <AlertTriangle size={16} aria-hidden="true" />
            <span>
              <b>La Supervisión solicitó una corrección:</b> {entrega.comentarioRevision}
            </span>
          </div>
        )}
        {estado === ESTADOS.ACEPTADO && (
          <Alert tipo="exito">
            La Supervisión aceptó su evidencia.{entrega.comentarioRevision ? ` Observaciones: ${entrega.comentarioRevision}` : ''}
          </Alert>
        )}

        {entrega && (
          <div className="delivered-file">
            <BotonDescarga archivo={entrega.archivo} />
            <span>
              Enviado el {formatoFechaHora(entrega.enviadoEn)}
              {fueraDePlazo(entrega, solicitud) && <span className="due-late">Fuera de plazo</span>}
            </span>
          </div>
        )}

        {puedeEnviar && (
          <SubirEvidencia solicitudId={solicitud.id} perfil={perfil} entregaAnterior={entrega} onEnviado={onCambio} />
        )}
        {!abierta && estado !== ESTADOS.ACEPTADO && (
          <Alert tipo="info">Esta solicitud fue cerrada por la Supervisión y ya no recibe archivos.</Alert>
        )}
      </section>

      <aside className="surface-card evidence-side">
        <h2>¿Cómo funciona?</h2>
        <div className="steps">
          {[
            ['Revise la solicitud', 'Lea las instrucciones y la fecha límite.'],
            ['Envíe su archivo', 'PDF, imagen, Word, Excel o PowerPoint de hasta 10 MB.'],
            ['La Supervisión lo revisa', 'Puede aceptarlo o pedir una corrección.'],
            ['Entrega aceptada', 'La solicitud queda completa para su plantel.'],
          ].map(([titulo, texto], i) => (
            <div key={titulo} className={`step${i + 1 < paso ? ' step-done' : ''}${i + 1 === paso ? ' step-current' : ''}`}>
              <span className="step-num">{i + 1}</span>
              <div>
                <strong>{titulo}</strong>
                <small>{texto}</small>
              </div>
            </div>
          ))}
        </div>
        <div className="side-note">
          <Info size={16} aria-hidden="true" />
          <p>Si necesita corregir algo, puede reemplazar el archivo mientras la entrega no haya sido aceptada.</p>
        </div>
      </aside>
    </div>
  );
}

// ---------- Vista de supervisión: seguimiento y revisión ----------
function VistaSupervision({ solicitud, entregas, perfil, nombres, onCambio }) {
  const [revisando, setRevisando] = useState(null);
  const [cambiando, setCambiando] = useState(false);
  const [error, setError] = useState('');

  const porPlantel = useMemo(() => Object.fromEntries(entregas.map((e) => [e.plantelId, e])), [entregas]);
  const conteo = useMemo(() => {
    const c = { pendiente: 0, entregado: 0, correccion: 0, aceptado: 0 };
    solicitud.plantelIds.forEach((id) => {
      c[porPlantel[id]?.estado ?? ESTADOS.PENDIENTE] += 1;
    });
    return c;
  }, [solicitud, porPlantel]);

  const puedeCerrar = solicitud.creadoPor === perfil.uid || perfil.rol === ROLES.SUPERVISORA;
  const abierta = solicitud.estado === SOLICITUD_ABIERTA;

  const alternarEstado = async () => {
    setError('');
    setCambiando(true);
    try {
      await cambiarEstadoSolicitud(solicitud.id, abierta ? SOLICITUD_CERRADA : SOLICITUD_ABIERTA);
      await onCambio();
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setCambiando(false);
    }
  };

  return (
    <div className="evidence-grid">
      <section className="surface-card evidence-main">
        <Encabezado solicitud={solicitud}>
          <div>
            <span>Estado de la solicitud</span>
            <strong>{abierta ? 'Abierta: recibe archivos' : 'Cerrada'}</strong>
          </div>
        </Encabezado>

        <h3 className="section-title">P-07 · Entregas por plantel</h3>
        <div className="table-wrap">
          <table className="request-table">
            <thead>
              <tr>
                <th>PLANTEL</th>
                <th>ESTADO</th>
                <th>ARCHIVO</th>
                <th>ENVIADO</th>
                <th aria-label="Acción" />
              </tr>
            </thead>
            <tbody>
              {solicitud.plantelIds.map((plantelId) => {
                const e = porPlantel[plantelId];
                return (
                  <Fragment key={plantelId}>
                    <tr>
                      <td>
                        <strong>{nombres[plantelId] ?? plantelId}</strong>
                      </td>
                      <td>
                        <StatusBadge estado={e?.estado ?? ESTADOS.PENDIENTE} />
                      </td>
                      <td>{e ? <BotonDescarga archivo={e.archivo} compacto /> : '—'}</td>
                      <td>
                        {e ? formatoFechaHora(e.enviadoEn) : '—'}
                        {fueraDePlazo(e, solicitud) && <span className="due-late">Fuera de plazo</span>}
                      </td>
                      <td>
                        {e && revisando !== e.id && (
                          <button type="button" className="btn btn-outline btn-sm" onClick={() => setRevisando(e.id)}>
                            {e.estado === ESTADOS.ENTREGADO ? 'Revisar' : 'Cambiar'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {e && revisando === e.id && (
                      <tr className="review-row">
                        <td colSpan={5}>
                          <RevisionEntrega
                            entrega={e}
                            perfil={perfil}
                            onCancelar={() => setRevisando(null)}
                            onRevisado={async () => {
                              setRevisando(null);
                              await onCambio();
                            }}
                          />
                        </td>
                      </tr>
                    )}
                    {e?.comentarioRevision && revisando !== e.id && (
                      <tr className="comment-row">
                        <td colSpan={5}>Observaciones: {e.comentarioRevision}</td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="surface-card evidence-side">
        <h2>Resumen</h2>
        <div className="summary-list">
          {[ESTADOS.ACEPTADO, ESTADOS.ENTREGADO, ESTADOS.CORRECCION, ESTADOS.PENDIENTE].map((estado) => (
            <div key={estado}>
              <StatusBadge estado={estado} />
              <strong>{conteo[estado]}</strong>
            </div>
          ))}
          <div className="summary-total">
            <span>Planteles</span>
            <strong>{solicitud.plantelIds.length}</strong>
          </div>
        </div>

        {error && <Alert tipo="error">{error}</Alert>}
        {puedeCerrar && (
          <button type="button" className="btn btn-outline" style={{ width: '100%' }} onClick={alternarEstado} disabled={cambiando}>
            {abierta ? <Lock size={15} aria-hidden="true" /> : <LockOpen size={15} aria-hidden="true" />}
            {abierta ? 'Cerrar solicitud' : 'Reabrir solicitud'}
          </button>
        )}
        <div className="side-note" style={{ marginTop: 16 }}>
          <Info size={16} aria-hidden="true" />
          <p>Al cerrar la solicitud, los planteles ya no podrán enviar ni reemplazar archivos.</p>
        </div>
      </aside>
    </div>
  );
}

export default function SolicitudDetallePage() {
  const { solicitudId } = useParams();
  const { perfil } = useAuth();
  const { nombres } = usePlanteles();
  const [solicitud, setSolicitud] = useState(null);
  const [entregas, setEntregas] = useState([]);
  const [estado, setEstado] = useState('cargando');

  const cargar = useCallback(async () => {
    try {
      const s = await obtenerSolicitud(solicitudId);
      if (!s) {
        setEstado('no-existe');
        return;
      }
      setSolicitud(s);
      setEntregas(await obtenerEntregasDeSolicitud(solicitudId, perfil));
      setEstado('listo');
    } catch (e) {
      console.error('[detalle solicitud]', e);
      setEstado(e.code === 'permission-denied' ? 'sin-permiso' : 'error');
    }
  }, [solicitudId, perfil]);

  useEffect(() => {
    setEstado('cargando');
    cargar();
  }, [cargar]);

  const volver = (
    <Link to="/solicitudes" className="back-link">
      <ArrowLeft size={16} aria-hidden="true" /> Volver a solicitudes
    </Link>
  );

  if (estado === 'cargando') return <Loader texto="Abriendo solicitud…" />;

  if (estado !== 'listo') {
    const sinPermiso = estado === 'sin-permiso';
    return (
      <>
        {volver}
        <EmptyState icono={sinPermiso ? Lock : SearchX} titulo={sinPermiso ? 'Solicitud no disponible para su plantel' : 'Solicitud no encontrada'}>
          <p>{sinPermiso ? 'Esta solicitud está dirigida a otros planteles.' : 'La solicitud no existe o fue eliminada.'}</p>
        </EmptyState>
      </>
    );
  }

  return (
    <>
      {volver}
      {perfil.rol === ROLES.DIRECTORA ? (
        <VistaDirectora solicitud={solicitud} entrega={entregas[0]} perfil={perfil} onCambio={cargar} />
      ) : (
        <VistaSupervision solicitud={solicitud} entregas={entregas} perfil={perfil} nombres={nombres} onCambio={cargar} />
      )}
    </>
  );
}
