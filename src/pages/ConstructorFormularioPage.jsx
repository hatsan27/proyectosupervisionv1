// Actividad 11 · Constructor de formularios: diseño, vista previa, borrador y publicación.
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, PencilRuler, Plus, Save, Send } from 'lucide-react';
import PageHeading from '../components/ui/PageHeading';
import Alert from '../components/ui/Alert';
import Loader from '../components/ui/Loader';
import DestinatariosSelector from '../components/forms/DestinatariosSelector';
import CampoEditor from '../components/formularios/CampoEditor';
import CampoInput from '../components/formularios/CampoInput';
import { useAuth } from '../hooks/useAuth';
import { usePlanteles } from '../hooks/usePlanteles';
import { campoVacio, ESTADOS_FORMULARIO, MAX_CAMPOS, TIPOS_CAMPO } from '../constants/formularios';
import { guardarFormulario, obtenerFormulario } from '../services/formulariosService';
import { erroresDeCampo, limpiarCampo } from '../utils/formularios';
import { mensajeDeError } from '../utils/firebaseErrors';

const isoEnDias = (dias) => {
  const d = new Date(Date.now() + dias * 864e5);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const aISO = (ts) => {
  const d = ts.toDate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function ConstructorFormularioPage() {
  const { formularioId } = useParams();
  const { perfil } = useAuth();
  const { planteles, cargando: cargandoPlanteles } = usePlanteles();
  const navigate = useNavigate();

  const [cargando, setCargando] = useState(Boolean(formularioId));
  const [bloqueado, setBloqueado] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaLimite, setFechaLimite] = useState(isoEnDias(7));
  const [alcance, setAlcance] = useState('todos');
  const [seleccion, setSeleccion] = useState([]);
  const [campos, setCampos] = useState([]);
  const [vista, setVista] = useState('diseno');
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    if (!formularioId) return;
    obtenerFormulario(formularioId)
      .then((f) => {
        if (!f) return setErrorGeneral('El formulario no existe.');
        if (f.estado !== ESTADOS_FORMULARIO.BORRADOR) setBloqueado(true);
        setTitulo(f.titulo);
        setDescripcion(f.descripcion ?? '');
        setFechaLimite(aISO(f.fechaLimite));
        setCampos(f.campos ?? []);
        setAlcance('seleccion');
        setSeleccion(f.plantelIds ?? []);
      })
      .catch((e) => setErrorGeneral(mensajeDeError(e)))
      .finally(() => setCargando(false));
  }, [formularioId]);

  const plantelIdsDestino = () =>
    alcance === 'todos' ? planteles.filter((p) => p.activo !== false).map((p) => p.id) : seleccion;

  const agregar = (tipo) => {
    if (campos.length >= MAX_CAMPOS) return;
    setCampos((prev) => [...prev, campoVacio(tipo)]);
  };
  const actualizar = (i, campo) => setCampos((prev) => prev.map((c, j) => (j === i ? campo : c)));
  const mover = (i, dir) =>
    setCampos((prev) => {
      const copia = [...prev];
      [copia[i], copia[i + dir]] = [copia[i + dir], copia[i]];
      return copia;
    });
  const eliminar = (i) => setCampos((prev) => prev.filter((_, j) => j !== i));

  const validar = (publicar) => {
    const e = {};
    if (titulo.trim().length < 3) e.titulo = 'Escriba un título de al menos 3 caracteres.';
    if (!fechaLimite) e.fechaLimite = 'Indique la fecha límite.';
    if (publicar) {
      if (campos.length === 0) e.campos = 'Agregue al menos un campo antes de publicar.';
      if (plantelIdsDestino().length === 0) e.destinatarios = 'Seleccione al menos un plantel.';
      campos.forEach((c) => {
        const err = erroresDeCampo(c);
        if (err) e[c.id] = err;
      });
    }
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const guardar = async (publicar) => {
    setErrorGeneral('');
    setAviso('');
    if (!validar(publicar)) {
      setErrorGeneral(publicar ? 'Revise los datos marcados antes de publicar.' : '');
      return;
    }
    setGuardando(true);
    try {
      const id = await guardarFormulario(
        { id: formularioId, titulo, descripcion, campos: campos.map(limpiarCampo), plantelIds: plantelIdsDestino(), fechaLimite },
        perfil,
        publicar,
      );
      if (publicar) navigate('/formularios', { replace: true, state: { mensaje: 'El formulario se publicó a los planteles.' } });
      else {
        setAviso('Borrador guardado.');
        if (!formularioId) navigate(`/formularios/${id}/editar`, { replace: true });
      }
    } catch (err) {
      console.error('[guardar formulario]', err);
      setErrorGeneral(mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <Loader texto="Cargando formulario…" />;

  const volver = (
    <Link to="/formularios" className="back-link">
      <ArrowLeft size={16} aria-hidden="true" /> Volver a formularios
    </Link>
  );

  if (bloqueado) {
    return (
      <>
        {volver}
        <Alert tipo="info">
          Este formulario ya fue publicado: sus campos no pueden modificarse para que el concentrado sea consistente.{' '}
          <Link to={`/formularios/${formularioId}/concentrado`}><b>Ver concentrado</b></Link>
        </Alert>
      </>
    );
  }

  return (
    <>
      {volver}
      <PageHeading
        eyebrow="P-09 · CONSTRUCTOR DE FORMULARIOS"
        titulo={formularioId ? 'Editar formulario (borrador)' : 'Nuevo formulario'}
        descripcion="Agregue las preguntas, revise la vista previa y publíquelo a los planteles."
      >
        <div className="segmented" role="tablist">
          <button type="button" role="tab" aria-selected={vista === 'diseno'} className={vista === 'diseno' ? 'active' : ''} onClick={() => setVista('diseno')}>
            <PencilRuler size={15} aria-hidden="true" /> Diseño
          </button>
          <button type="button" role="tab" aria-selected={vista === 'previa'} className={vista === 'previa' ? 'active' : ''} onClick={() => setVista('previa')}>
            <Eye size={15} aria-hidden="true" /> Vista previa
          </button>
        </div>
      </PageHeading>

      {aviso && <Alert tipo="exito">{aviso}</Alert>}
      {errorGeneral && <Alert tipo="error">{errorGeneral}</Alert>}

      {vista === 'previa' ? (
        <section className="surface-card form-card">
          <div className="eyebrow">VISTA PREVIA · ASÍ LO VERÁ LA DIRECTORA</div>
          <h2 className="preview-title">{titulo || 'Formulario sin título'}</h2>
          {descripcion && <p className="evidence-description" style={{ whiteSpace: 'pre-wrap' }}>{descripcion}</p>}
          {campos.length === 0 && <div className="empty">Todavía no hay campos.</div>}
          {campos.map((c) => (
            <CampoInput key={c.id} campo={c} valor={c.tipo === 'tabla' ? [] : ''} onChange={() => {}} disabled />
          ))}
        </section>
      ) : (
        <div className="builder-grid">
          <section className="surface-card form-card">
            <h3 className="section-title">Datos generales</h3>
            <div className="form-field">
              <label htmlFor="titulo">Título</label>
              <input id="titulo" type="text" maxLength={150} value={titulo} disabled={guardando}
                placeholder="Ej. Matrícula por grado" onChange={(e) => setTitulo(e.target.value)} />
              <div className="form-help"><span className="form-error">{errores.titulo}</span><span>{titulo.length}/150</span></div>
            </div>
            <div className="form-field">
              <label htmlFor="descripcion">Instrucciones <span style={{ fontWeight: 400, color: '#94a3a6' }}>(opcional)</span></label>
              <textarea id="descripcion" maxLength={5000} value={descripcion} disabled={guardando} style={{ minHeight: 90 }}
                onChange={(e) => setDescripcion(e.target.value)} />
            </div>
            <div className="form-field" style={{ maxWidth: 260 }}>
              <label htmlFor="fechaLimite">Fecha límite</label>
              <input id="fechaLimite" type="date" value={fechaLimite} disabled={guardando} onChange={(e) => setFechaLimite(e.target.value)} />
              <div className="form-help"><span className="form-error">{errores.fechaLimite}</span></div>
            </div>
            <DestinatariosSelector
              alcance={alcance}
              onAlcance={setAlcance}
              seleccion={seleccion}
              onAlternar={(id) => setSeleccion((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
              planteles={planteles}
              cargando={cargandoPlanteles}
              disabled={guardando}
              error={errores.destinatarios}
            />

            <h3 className="section-title">Campos ({campos.length})</h3>
            {errores.campos && <div className="form-help" style={{ marginBottom: 10 }}><span className="form-error">{errores.campos}</span></div>}
            {campos.length === 0 && <div className="empty" style={{ padding: 18 }}>Agregue el primer campo con los botones de tipo.</div>}
            {campos.map((c, i) => (
              <CampoEditor
                key={c.id}
                campo={c}
                indice={i}
                total={campos.length}
                error={errores[c.id]}
                onChange={(nuevo) => actualizar(i, nuevo)}
                onMover={(dir) => mover(i, dir)}
                onEliminar={() => eliminar(i)}
              />
            ))}

            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={() => guardar(false)} disabled={guardando}>
                <Save size={16} aria-hidden="true" /> Guardar borrador
              </button>
              <button type="button" className="btn btn-primary" onClick={() => guardar(true)} disabled={guardando}>
                <Send size={16} aria-hidden="true" /> {guardando ? 'Guardando…' : 'Publicar'}
              </button>
            </div>
          </section>

          <aside className="surface-card evidence-side builder-side">
            <h2>Agregar campo</h2>
            <div className="type-buttons">
              {TIPOS_CAMPO.map((t) => (
                <button key={t.id} type="button" className="type-button" onClick={() => agregar(t.id)} disabled={guardando}>
                  <Plus size={15} aria-hidden="true" />
                  <span>
                    <strong>{t.label}</strong>
                    <small>{t.ayuda}</small>
                  </span>
                </button>
              ))}
            </div>
            <div className="side-note">
              <p>Los formularios capturan información del plantel (por ejemplo, totales por grado), no expedientes de alumnos.</p>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
