// Actividad 11 · Captura de un formulario por la directora (RF-08, RF-10).
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Lock, SearchX, Send } from 'lucide-react';
import PageHeading from '../components/ui/PageHeading';
import Alert from '../components/ui/Alert';
import Loader from '../components/ui/Loader';
import EmptyState from '../components/ui/EmptyState';
import CampoInput from '../components/formularios/CampoInput';
import { useAuth } from '../hooks/useAuth';
import { ESTADOS_FORMULARIO } from '../constants/formularios';
import { obtenerFormulario } from '../services/formulariosService';
import { guardarRespuesta, obtenerMiRespuesta } from '../services/respuestasService';
import { normalizarRespuestas, validarRespuestas } from '../utils/formularios';
import { formatoFecha, formatoFechaHora } from '../utils/formatDate';
import { mensajeDeError } from '../utils/firebaseErrors';

export default function ResponderFormularioPage() {
  const { formularioId } = useParams();
  const { perfil } = useAuth();
  const [formulario, setFormulario] = useState(null);
  const [respuesta, setRespuesta] = useState(null);
  const [valores, setValores] = useState({});
  const [estado, setEstado] = useState('cargando');
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const f = await obtenerFormulario(formularioId);
        if (!f) return setEstado('no-existe');
        const r = await obtenerMiRespuesta(formularioId, perfil);
        setFormulario(f);
        setRespuesta(r);
        // Convierte los números guardados a texto para los campos de captura.
        const inicial = {};
        (f.campos ?? []).forEach((c) => {
          const v = r?.valores?.[c.id];
          inicial[c.id] = c.tipo === 'numero' ? (v ?? '') : v ?? (c.tipo === 'tabla' ? [] : '');
        });
        setValores(inicial);
        setEstado('listo');
      } catch (e) {
        console.error('[responder]', e);
        setEstado(e.code === 'permission-denied' ? 'sin-permiso' : 'error');
      }
    })();
  }, [formularioId, perfil]);

  const volver = (
    <Link to="/formularios" className="back-link">
      <ArrowLeft size={16} aria-hidden="true" /> Volver a formularios
    </Link>
  );

  if (estado === 'cargando') return <Loader texto="Abriendo formulario…" />;
  if (estado !== 'listo') {
    const sinPermiso = estado === 'sin-permiso';
    return (
      <>
        {volver}
        <EmptyState icono={sinPermiso ? Lock : SearchX} titulo={sinPermiso ? 'Formulario no disponible para su plantel' : 'Formulario no encontrado'}>
          <p>{sinPermiso ? 'Este formulario no está dirigido a su plantel o todavía no se publica.' : 'El formulario no existe o fue eliminado.'}</p>
        </EmptyState>
      </>
    );
  }

  const abierto = formulario.estado === ESTADOS_FORMULARIO.PUBLICADO;

  const enviar = async (ev) => {
    ev.preventDefault();
    setMensaje(null);
    const e = validarRespuestas(formulario.campos, valores);
    setErrores(e);
    if (Object.keys(e).length) {
      setMensaje({ tipo: 'error', texto: 'Revise los datos marcados.' });
      return;
    }
    setGuardando(true);
    try {
      await guardarRespuesta(formularioId, normalizarRespuestas(formulario.campos, valores), perfil, respuesta);
      setRespuesta(await obtenerMiRespuesta(formularioId, perfil));
      setMensaje({ tipo: 'exito', texto: 'Su respuesta se guardó correctamente.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('[guardar respuesta]', err);
      setMensaje({ tipo: 'error', texto: mensajeDeError(err) });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      {volver}
      <PageHeading
        eyebrow="P-09 · RESPONDER FORMULARIO"
        titulo={formulario.titulo}
        descripcion={`Fecha límite: ${formatoFecha(formulario.fechaLimite)} · ${perfil.plantelNombre}`}
      />
      {mensaje && <Alert tipo={mensaje.tipo}>{mensaje.texto}</Alert>}
      {!abierto && <Alert tipo="info">Este formulario fue cerrado por la Supervisión. Su respuesta se muestra solo para consulta.</Alert>}
      {respuesta && abierto && !mensaje && (
        <Alert tipo="info">Ya envió su respuesta el {formatoFechaHora(respuesta.enviadoEn)}. Puede modificarla mientras el formulario siga abierto.</Alert>
      )}

      <form className="surface-card form-card" onSubmit={enviar} noValidate>
        {formulario.descripcion && <p className="evidence-description" style={{ whiteSpace: 'pre-wrap' }}>{formulario.descripcion}</p>}
        {formulario.campos.map((c) => (
          <CampoInput
            key={c.id}
            campo={c}
            valor={valores[c.id]}
            error={errores[c.id]}
            disabled={!abierto || guardando}
            onChange={(v) => {
              setValores((p) => ({ ...p, [c.id]: v }));
              if (errores[c.id]) setErrores((p) => ({ ...p, [c.id]: undefined }));
            }}
          />
        ))}
        {abierto && (
          <div className="form-actions">
            <span className="form-help" style={{ marginRight: 'auto' }}>* Obligatorio</span>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              <Send size={16} aria-hidden="true" /> {guardando ? 'Guardando…' : respuesta ? 'Guardar cambios' : 'Enviar respuesta'}
            </button>
          </div>
        )}
      </form>
    </>
  );
}
