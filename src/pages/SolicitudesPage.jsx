// P-05 · Solicitudes: listado y estado (RF-04, RF-06, RF-10).
import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ClipboardList, Eye, Plus } from 'lucide-react';
import PageHeading from '../components/ui/PageHeading';
import Alert from '../components/ui/Alert';
import StatusBadge from '../components/ui/StatusBadge';
import { useAuth } from '../hooks/useAuth';
import { useSolicitudes } from '../hooks/useSolicitudes';
import { ROLES } from '../constants/roles';
import { ESTADOS, SOLICITUD_ABIERTA } from '../constants/estados';
import { estaVencida } from '../services/solicitudesService';
import { formatoFecha } from '../utils/formatDate';
import { mensajeDeError } from '../utils/firebaseErrors';

const resumen = (t = '', max = 110) => (t.length > max ? `${t.slice(0, max).trimEnd()}…` : t);

const FILTROS_DIRECTORA = [
  { id: 'todas', label: 'Todas' },
  { id: ESTADOS.PENDIENTE, label: 'Pendientes' },
  { id: ESTADOS.CORRECCION, label: 'Corrección' },
  { id: ESTADOS.ENTREGADO, label: 'Entregadas' },
  { id: ESTADOS.ACEPTADO, label: 'Aceptadas' },
];
const FILTROS_SUPERVISION = [
  { id: 'abiertas', label: 'Abiertas' },
  { id: 'revisar', label: 'Con entregas por revisar' },
  { id: 'cerradas', label: 'Cerradas' },
  { id: 'todas', label: 'Todas' },
];

function FechaLimite({ solicitud, mostrarVencida }) {
  const vencida = estaVencida(solicitud);
  return (
    <>
      {formatoFecha(solicitud.fechaLimite)}
      {vencida && mostrarVencida && <span className="due-late">Vencida</span>}
    </>
  );
}

export default function SolicitudesPage() {
  const { perfil } = useAuth();
  const location = useLocation();
  const { solicitudes, cargando, error, estadoDePlantel, avance } = useSolicitudes();
  const esDirectora = perfil.rol === ROLES.DIRECTORA;
  const filtros = esDirectora ? FILTROS_DIRECTORA : FILTROS_SUPERVISION;
  const [filtro, setFiltro] = useState(filtros[0].id);

  const visibles = useMemo(() => {
    if (esDirectora) {
      return filtro === 'todas' ? solicitudes : solicitudes.filter((s) => estadoDePlantel(s.id) === filtro);
    }
    switch (filtro) {
      case 'abiertas':
        return solicitudes.filter((s) => s.estado === SOLICITUD_ABIERTA);
      case 'cerradas':
        return solicitudes.filter((s) => s.estado !== SOLICITUD_ABIERTA);
      case 'revisar':
        return solicitudes.filter((s) => avance(s).porRevisar > 0);
      default:
        return solicitudes;
    }
  }, [solicitudes, filtro, esDirectora, estadoDePlantel, avance]);

  return (
    <>
      <PageHeading
        eyebrow="P-05 · SOLICITUDES"
        titulo="Solicitudes de evidencia"
        descripcion={
          esDirectora
            ? `Documentos que la Supervisión solicita a ${perfil.plantelNombre}. Revise la fecha límite de cada uno.`
            : 'Solicitudes enviadas a los planteles y avance de sus entregas.'
        }
      >
        {!esDirectora && (
          <Link to="/solicitudes/nueva" className="btn btn-primary">
            <Plus size={17} aria-hidden="true" /> Nueva solicitud
          </Link>
        )}
      </PageHeading>

      {location.state?.creada && <Alert tipo="exito">La solicitud se envió a los planteles.</Alert>}
      {error && <Alert tipo="error">{mensajeDeError(error)}</Alert>}

      <section className="surface-card requests-card">
        <div className="requests-intro">
          <div>
            <h2>{esDirectora ? 'Solicitudes para su plantel' : 'Solicitudes de la zona'}</h2>
            <p>Seleccione una solicitud para ver el detalle{esDirectora ? ' y enviar su archivo.' : ' y revisar las entregas.'}</p>
          </div>
          <span className="requests-count">{cargando ? '…' : `${visibles.length} de ${solicitudes.length}`}</span>
        </div>

        <div className="filter-pills" role="tablist">
          {filtros.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filtro === f.id}
              className={`filter-pill${filtro === f.id ? ' selected' : ''}`}
              onClick={() => setFiltro(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="table-wrap">
          <table className="request-table">
            <thead>
              <tr>
                <th>SOLICITUD</th>
                <th>FECHA LÍMITE</th>
                <th>{esDirectora ? 'ESTADO' : 'AVANCE'}</th>
                <th aria-label="Ver" />
              </tr>
            </thead>
            <tbody>
              {cargando && (
                <tr>
                  <td colSpan={4} className="empty">Cargando solicitudes…</td>
                </tr>
              )}
              {!cargando && visibles.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty">
                    <ClipboardList size={20} aria-hidden="true" style={{ display: 'block', margin: '0 auto 8px' }} />
                    No hay solicitudes en esta vista.
                  </td>
                </tr>
              )}
              {visibles.map((s) => {
                const estado = esDirectora ? estadoDePlantel(s.id) : null;
                const a = esDirectora ? null : avance(s);
                return (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.titulo}</strong>
                      <span>{resumen(s.descripcion) || 'Sin descripción'}</span>
                    </td>
                    <td>
                      <FechaLimite
                        solicitud={s}
                        mostrarVencida={esDirectora ? estado === ESTADOS.PENDIENTE || estado === ESTADOS.CORRECCION : s.estado === SOLICITUD_ABIERTA}
                      />
                    </td>
                    <td>
                      {esDirectora ? (
                        <>
                          <StatusBadge estado={estado} />
                          {s.estado !== SOLICITUD_ABIERTA && <span className="tag-closed">Cerrada</span>}
                        </>
                      ) : (
                        <div className="progress-cell">
                          <div className="progress-bar" aria-hidden="true">
                            <div style={{ width: `${(a.aceptadas / a.total) * 100}%` }} className="pb-ok" />
                            <div style={{ width: `${((a.porRevisar + a.correccion) / a.total) * 100}%` }} className="pb-mid" />
                          </div>
                          <span>
                            {a.recibidas}/{a.total} recibidas
                            {a.porRevisar > 0 && <b> · {a.porRevisar} por revisar</b>}
                          </span>
                          {s.estado !== SOLICITUD_ABIERTA && <span className="tag-closed">Cerrada</span>}
                        </div>
                      )}
                    </td>
                    <td>
                      <Link to={`/solicitudes/${s.id}`} className="table-view" aria-label={`Ver ${s.titulo}`}>
                        <Eye size={15} />
                      </Link>
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
