// P-02 · Panel principal: resumen y accesos según el rol.
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Info,
  Megaphone,
  PenSquare,
  School,
} from 'lucide-react';
import PageHeading from '../components/ui/PageHeading';
import Alert from '../components/ui/Alert';
import { useAuth } from '../hooks/useAuth';
import { useAvisos } from '../hooks/useAvisos';
import { usePlanteles } from '../hooks/usePlanteles';
import { ROLES, ROLE_LABELS } from '../constants/roles';
import { esDelMesActual, formatoFecha } from '../utils/formatDate';
import { textoDestinatarios } from '../components/avisos/destinatarios';
import { mensajeDeError } from '../utils/firebaseErrors';

const EXPLICACION = {
  [ROLES.SUPERVISORA]:
    'Como supervisora puede publicar avisos para todos los planteles o para planteles específicos. Cada directora verá únicamente los avisos que le correspondan.',
  [ROLES.ADMINISTRATIVA]:
    'Puede consultar los avisos de la zona. La creación de solicitudes y la actualización de formatos se habilitarán en las siguientes etapas.',
  [ROLES.DIRECTORA]:
    'Aquí verá los avisos generales y los dirigidos a su plantel. Próximamente podrá enviar evidencias y responder formularios desde este mismo panel.',
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

  const esSupervisora = perfil.rol === ROLES.SUPERVISORA;
  const esDirectora = perfil.rol === ROLES.DIRECTORA;
  const primerNombre = perfil.nombre?.split(' ')[0] ?? '';
  const recientes = avisos.slice(0, 4);
  const delMes = avisos.filter((a) => esDelMesActual(a.publicadoEn)).length;

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
        <StatCard icono={ClipboardList} valor="—" etiqueta="Solicitudes pendientes" pie="Disponible en la siguiente etapa" />
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
          <QuickLink to="/solicitudes" icono={ClipboardList} titulo="Solicitudes y evidencias" detalle="Próximamente" />

          <div className="explain-strip">
            <Info size={17} aria-hidden="true" />
            <p>{EXPLICACION[perfil.rol]}</p>
          </div>
        </aside>
      </div>
    </>
  );
}
