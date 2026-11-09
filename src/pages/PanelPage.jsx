// P-02 · Panel principal: resumen y accesos según el rol.
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FilePlus2,
  FolderOpen,
  FileSpreadsheet,
  Info,
  Megaphone,
  PenSquare,
  School,
} from 'lucide-react';
import PageHeading from '../components/ui/PageHeading';
import Alert from '../components/ui/Alert';
import { useAuth } from '../hooks/useAuth';
import { useAvisos } from '../hooks/useAvisos';
import { useSolicitudes } from '../hooks/useSolicitudes';
import { ESTADOS, SOLICITUD_ABIERTA } from '../constants/estados';
import { usePlanteles } from '../hooks/usePlanteles';
import { ROLES, ROLE_LABELS } from '../constants/roles';
import { esDelMesActual, formatoFecha } from '../utils/formatDate';
import { textoDestinatarios } from '../components/avisos/destinatarios';
import { mensajeDeError } from '../utils/firebaseErrors';

const EXPLICACION = {
  [ROLES.SUPERVISORA]:
    'Como supervisora puede publicar avisos, solicitar evidencias, actualizar el banco de formatos y aplicar formularios a todos los planteles o a planteles específicos. Cada directora verá únicamente lo que le corresponda.',
  [ROLES.ADMINISTRATIVA]:
    'Puede consultar los avisos, crear solicitudes y revisar evidencias, actualizar el banco de formatos y diseñar formularios con sus concentrados.',
  [ROLES.DIRECTORA]:
    'Aquí verá los avisos para su plantel, las solicitudes de evidencia, los formatos vigentes y los formularios por responder.',
};

function StatCard({ icono: Icono, valor, etiqueta, pie }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className="stat-icon">
          <Icono size={20} aria-hidden="true" />
        </span>
      </div>
      <div className="stat-value">{valor}</div>
      <div className="stat-label">{etiqueta}</div>
      <div className="stat-foot">{pie}</div>
    </div>
  );
}

function QuickLink({ to, icono: Icono, titulo, detalle }) {
  return (
    <Link to={to} className="quick-link">
      <span className="quick-icon">
        <Icono size={17} aria-hidden="true" />
      </span>
      <span>
        <strong>{titulo}</strong>
        <small>{detalle}</small>
      </span>
      <ChevronRight size={17} aria-hidden="true" />
    </Link>
  );
}

export default function PanelPage() {
  const { perfil } = useAuth();
  const { avisos, cargando, error } = useAvisos();
  const { planteles, nombres } = usePlanteles();
  const { solicitudes, cargando: cargandoSol, estadoDePlantel, avance } = useSolicitudes();

  const esSupervisora = perfil.rol === ROLES.SUPERVISORA;
  const esDirectora = perfil.rol === ROLES.DIRECTORA;
  const primerNombre = perfil.nombre?.split(' ')[0] ?? '';
  const recientes = avisos.slice(0, 4);
  const delMes = avisos.filter((a) => esDelMesActual(a.publicadoEn)).length;

  // Directora: solicitudes abiertas sin entregar o en corrección. Supervisión: entregas por revisar.
  const pendientesSolicitudes = esDirectora
    ? solicitudes.filter(
        (s) => s.estado === SOLICITUD_ABIERTA && [ESTADOS.PENDIENTE, ESTADOS.CORRECCION].includes(estadoDePlantel(s.id)),
      ).length
    : solicitudes.reduce((total, s) => total + avance(s).porRevisar, 0);

  return (
    <>
      <PageHeading
        eyebrow={`PANEL · ${ROLE_LABELS[perfil.rol].toUpperCase()}`}
        titulo={`Hola, ${primerNombre}`}
        descripcion="Este es el resumen de la información disponible para su perfil."
      >
        <span className="page-chip">
          <CalendarDays size={15} aria-hidden="true" />
          {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      </PageHeading>

      {error && <Alert tipo="error">{mensajeDeError(error)}</Alert>}

      <div className="stats-grid">
        <StatCard
          icono={Megaphone}
          valor={cargando ? '…' : avisos.length}
          etiqueta={esDirectora ? 'Avisos para su plantel' : 'Avisos publicados'}
          pie="Total disponible para consulta"
        />
        <StatCard icono={CalendarDays} valor={cargando ? '…' : delMes} etiqueta="Avisos de este mes" pie="Publicados en el mes actual" />
        <StatCard
          icono={School}
          valor={esDirectora ? '1' : planteles.length}
          etiqueta={esDirectora ? 'Su plantel' : 'Planteles de la zona'}
          pie={esDirectora ? perfil.plantelNombre : 'Registrados en la plataforma'}
        />
        <StatCard
          icono={ClipboardList}
          valor={cargandoSol ? '…' : pendientesSolicitudes}
          etiqueta={esDirectora ? 'Solicitudes pendientes' : 'Entregas por revisar'}
          pie={esDirectora ? 'Por enviar o corregir' : 'Archivos recibidos sin revisar'}
        />
      </div>

      <div className="dashboard-columns">
        <section className="surface-card activity-card">
          <div className="card-header">
            <div>
              <div className="card-kicker">COMUNICADOS</div>
              <h2>Avisos recientes</h2>
            </div>
            <Link to="/avisos" className="link-button">
              Ver todos <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

          <div className="activity-list">
            {cargando && <div className="empty">Cargando avisos…</div>}
            {!cargando && recientes.length === 0 && <div className="empty">Todavía no hay avisos publicados.</div>}
            {recientes.map((aviso) => (
              <Link key={aviso.id} to={`/avisos/${aviso.id}`} className="activity-row">
                <span className="activity-icon">
                  <Megaphone size={16} aria-hidden="true" />
                </span>
                <span className="activity-main">
                  <strong>{aviso.titulo}</strong>
                  <span>
                    {formatoFecha(aviso.publicadoEn)} · {textoDestinatarios(aviso.destinatarios, nombres)}
                  </span>
                </span>
                <ChevronRight size={16} color="#9cb3b4" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>

        <aside className="surface-card quick-card">
          <div className="card-kicker">ACCESOS RÁPIDOS</div>
          <h2>¿Qué desea hacer?</h2>
          <p>Las opciones mostradas corresponden a su perfil.</p>
          {esSupervisora && (
            <QuickLink to="/avisos/nuevo" icono={PenSquare} titulo="Publicar un aviso" detalle="Redactar y elegir destinatarios" />
          )}
          <QuickLink to="/avisos" icono={Megaphone} titulo="Consultar avisos" detalle="Ver los comunicados disponibles" />
          {!esDirectora && (
            <QuickLink to="/solicitudes/nueva" icono={FilePlus2} titulo="Solicitar evidencia" detalle="Pedir un documento a los planteles" />
          )}
          <QuickLink
            to="/solicitudes"
            icono={ClipboardList}
            titulo={esDirectora ? 'Enviar evidencias' : 'Revisar entregas'}
            detalle={esDirectora ? 'Solicitudes para su plantel' : 'Avance de las solicitudes'}
          />
          <QuickLink to="/formatos" icono={FolderOpen} titulo="Banco de formatos" detalle="Consultar y descargar formatos vigentes" />
          <QuickLink
            to="/formularios"
            icono={FileSpreadsheet}
            titulo={esDirectora ? 'Responder formularios' : 'Formularios y concentrados'}
            detalle={esDirectora ? 'Información que pide la Supervisión' : 'Diseñar, publicar y exportar'}
          />

          <div className="explain-strip">
            <Info size={17} aria-hidden="true" />
            <p>{EXPLICACION[perfil.rol]}</p>
          </div>
        </aside>
      </div>
    </>
  );
}
