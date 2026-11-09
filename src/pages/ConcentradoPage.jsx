// Actividad 12 · Concentrado de respuestas y exportación a Excel, PDF y Word (RF-09).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileDown, FileSpreadsheet, FileText, Lock, LockOpen } from 'lucide-react';
import PageHeading from '../components/ui/PageHeading';
import Alert from '../components/ui/Alert';
import Loader from '../components/ui/Loader';
import { useAuth } from '../hooks/useAuth';
import { usePlanteles } from '../hooks/usePlanteles';
import { ROLES } from '../constants/roles';
import { ESTADOS_FORMULARIO, ESTADO_FORMULARIO_LABELS } from '../constants/formularios';
import { cambiarEstadoFormulario, obtenerFormulario } from '../services/formulariosService';
import { obtenerRespuestasDeFormulario } from '../services/respuestasService';
import { construirConcentrado } from '../utils/concentrado';
import { exportarExcel, exportarPDF, exportarWord } from '../utils/exportar';
import { formatoFecha } from '../utils/formatDate';
import { mensajeDeError } from '../utils/firebaseErrors';

function TablaConcentrado({ titulo, headers, rows, totales }) {
  return (
    <section className="surface-card requests-card concentrado-card">
      <h2 className="section-title" style={{ marginTop: 0 }}>{titulo}</h2>
      <div className="table-wrap">
        <table className="request-table concentrado-table">
          <thead>
            <tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={headers.length} className="empty">Sin respuestas todavía.</td></tr>}
            {rows.map((r, i) => (
              <tr key={i}>{r.map((v, j) => <td key={j}>{v}</td>)}</tr>
            ))}
          </tbody>
          {totales && (
            <tfoot>
              <tr>{totales.map((v, i) => <td key={i}>{v}</td>)}</tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}

export default function ConcentradoPage() {
  const { formularioId } = useParams();
  const { perfil } = useAuth();
  const { nombres, cargando: cargandoPlanteles } = usePlanteles();
  const [formulario, setFormulario] = useState(null);
  const [respuestas, setRespuestas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exportando, setExportando] = useState(null);

  const cargar = useCallback(async () => {
    setError('');
    try {
      const f = await obtenerFormulario(formularioId);
      if (!f) throw Object.assign(new Error('no-existe'), { code: 'not-found' });
      setFormulario(f);
      setRespuestas(await obtenerRespuestasDeFormulario(formularioId));
    } catch (e) {
      console.error('[concentrado]', e);
      setError(e.code === 'not-found' ? 'El formulario no existe.' : mensajeDeError(e));
    } finally {
      setCargando(false);
    }
  }, [formularioId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const concentrado = useMemo(
    () => (formulario && !cargandoPlanteles ? construirConcentrado(formulario, respuestas, nombres) : null),
    [formulario, respuestas, nombres, cargandoPlanteles],
  );

  const exportar = async (tipo, fn) => {
    setExportando(tipo);
    setError('');
    try {
      await fn(concentrado);
    } catch (e) {
      console.error('[exportar]', e);
      setError('No se pudo generar el archivo. Intente de nuevo.');
    } finally {
      setExportando(null);
    }
  };

  const alternarEstado = async () => {
    try {
      await cambiarEstadoFormulario(
        formularioId,
        formulario.estado === ESTADOS_FORMULARIO.PUBLICADO ? ESTADOS_FORMULARIO.CERRADO : ESTADOS_FORMULARIO.PUBLICADO,
      );
      await cargar();
    } catch (e) {
      setError(mensajeDeError(e));
    }
  };

  const volver = (
    <Link to="/formularios" className="back-link">
      <ArrowLeft size={16} aria-hidden="true" /> Volver a formularios
    </Link>
  );

  if (cargando || (formulario && !concentrado)) return <Loader texto="Preparando concentrado…" />;
  if (!formulario) return <>{volver}<Alert tipo="error">{error}</Alert></>;

  const puedeCambiar = formulario.creadoPor === perfil.uid || perfil.rol === ROLES.SUPERVISORA;
  const total = formulario.plantelIds.length;

  return (
    <>
      {volver}
      <PageHeading
        eyebrow="ACTIVIDAD 12 · CONCENTRADO"
        titulo={formulario.titulo}
        descripcion={`${ESTADO_FORMULARIO_LABELS[formulario.estado]} · Fecha límite ${formatoFecha(formulario.fechaLimite)} · Respondieron ${concentrado.respondieron.length} de ${total} planteles`}
      >
        <div className="export-buttons">
          <button type="button" className="btn btn-outline" disabled={!!exportando} onClick={() => exportar('xlsx', exportarExcel)}>
            <FileSpreadsheet size={16} aria-hidden="true" /> {exportando === 'xlsx' ? 'Generando…' : 'Excel'}
          </button>
          <button type="button" className="btn btn-outline" disabled={!!exportando} onClick={() => exportar('pdf', exportarPDF)}>
            <FileDown size={16} aria-hidden="true" /> {exportando === 'pdf' ? 'Generando…' : 'PDF'}
          </button>
          <button type="button" className="btn btn-outline" disabled={!!exportando} onClick={() => exportar('docx', exportarWord)}>
            <FileText size={16} aria-hidden="true" /> {exportando === 'docx' ? 'Generando…' : 'Word'}
          </button>
        </div>
      </PageHeading>

      {error && <Alert tipo="error">{error}</Alert>}

      <div className="concentrado-summary">
        <div className="surface-card">
          <span>Respondieron</span>
          <strong>{concentrado.respondieron.length}/{total}</strong>
          <div className="progress-bar" style={{ maxWidth: 'none' }}>
            <div className="pb-ok" style={{ width: `${(concentrado.respondieron.length / total) * 100}%` }} />
          </div>
        </div>
        <div className="surface-card">
          <span>Pendientes</span>
          <p>{concentrado.pendientes.length ? concentrado.pendientes.join(', ') : 'Ninguno: todos respondieron.'}</p>
        </div>
        {puedeCambiar && formulario.estado !== ESTADOS_FORMULARIO.BORRADOR && (
          <div className="surface-card">
            <span>Recepción de respuestas</span>
            <button type="button" className="btn btn-outline" onClick={alternarEstado}>
              {formulario.estado === ESTADOS_FORMULARIO.PUBLICADO ? <Lock size={15} aria-hidden="true" /> : <LockOpen size={15} aria-hidden="true" />}
              {formulario.estado === ESTADOS_FORMULARIO.PUBLICADO ? 'Cerrar formulario' : 'Reabrir formulario'}
            </button>
          </div>
        )}
      </div>

      <TablaConcentrado titulo="Respuestas por plantel" {...concentrado.general} />
      {concentrado.tablas.map((t, i) => (
        <TablaConcentrado key={i} {...t} />
      ))}
    </>
  );
}
