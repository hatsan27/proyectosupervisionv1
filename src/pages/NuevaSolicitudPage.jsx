// P-05 · Nueva solicitud de evidencia (supervisora o personal administrativo, RF-04).
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import PageHeading from '../components/ui/PageHeading';
import Alert from '../components/ui/Alert';
import DestinatariosSelector from '../components/forms/DestinatariosSelector';
import { useAuth } from '../hooks/useAuth';
import { usePlanteles } from '../hooks/usePlanteles';
import { crearSolicitud } from '../services/solicitudesService';
import { mensajeDeError } from '../utils/firebaseErrors';

const MAX_TITULO = 150;
const MAX_DESCRIPCION = 5000;

const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function NuevaSolicitudPage() {
  const { perfil } = useAuth();
  const { planteles, cargando: cargandoPlanteles } = usePlanteles();
  const navigate = useNavigate();

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');
  const [alcance, setAlcance] = useState('todos');
  const [seleccion, setSeleccion] = useState([]);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [guardando, setGuardando] = useState(false);

  const limpiar = (campo) => errores[campo] && setErrores((prev) => ({ ...prev, [campo]: undefined }));

  const alternarPlantel = (id) => {
    limpiar('destinatarios');
    setSeleccion((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const plantelIdsDestino = () =>
    alcance === 'todos' ? planteles.filter((p) => p.activo !== false).map((p) => p.id) : seleccion;

  const validar = () => {
    const e = {};
    if (titulo.trim().length < 3) e.titulo = 'Escriba un título de al menos 3 caracteres.';
    if (!fechaLimite) e.fechaLimite = 'Indique la fecha límite de entrega.';
    else if (fechaLimite < hoyISO()) e.fechaLimite = 'La fecha límite no puede ser anterior a hoy.';
    if (plantelIdsDestino().length === 0) {
      e.destinatarios = alcance === 'todos' ? 'No hay planteles activos registrados.' : 'Seleccione al menos un plantel.';
    }
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const enviar = async (ev) => {
    ev.preventDefault();
    setErrorGeneral('');
    if (!validar()) return;
    setGuardando(true);
    try {
      await crearSolicitud({ titulo, descripcion, fechaLimite, plantelIds: plantelIdsDestino() }, perfil);
      navigate('/solicitudes', { replace: true, state: { creada: true } });
    } catch (err) {
      console.error('[crear solicitud]', err);
      setErrorGeneral(mensajeDeError(err));
      setGuardando(false);
    }
  };

  return (
    <>
      <Link to="/solicitudes" className="back-link">
        <ArrowLeft size={16} aria-hidden="true" /> Volver a solicitudes
      </Link>

      <PageHeading
        eyebrow="P-05 · NUEVA SOLICITUD"
        titulo="Solicitar evidencia a los planteles"
        descripcion="Describa el documento que necesita, la fecha límite y a qué planteles se le pide."
      />

      <form className="surface-card form-card" onSubmit={enviar} noValidate>
        {errorGeneral && <Alert tipo="error">{errorGeneral}</Alert>}

        <div className="form-field">
          <label htmlFor="titulo">Título</label>
          <input
            id="titulo"
            type="text"
            maxLength={MAX_TITULO}
            placeholder="Ej. Plan de trabajo del segundo periodo"
            value={titulo}
            onChange={(e) => {
              setTitulo(e.target.value);
              limpiar('titulo');
            }}
            disabled={guardando}
          />
          <div className="form-help">
            <span className="form-error">{errores.titulo}</span>
            <span>
              {titulo.length}/{MAX_TITULO}
            </span>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="descripcion">
            Instrucciones <span style={{ fontWeight: 400, color: '#94a3a6' }}>(opcional)</span>
          </label>
          <textarea
            id="descripcion"
            maxLength={MAX_DESCRIPCION}
            placeholder="Qué documento deben enviar, formato esperado y cualquier indicación."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            disabled={guardando}
            style={{ minHeight: 140 }}
          />
          <div className="form-help">
            <span />
            <span>
              {descripcion.length}/{MAX_DESCRIPCION}
            </span>
          </div>
        </div>

        <div className="form-field" style={{ maxWidth: 280 }}>
          <label htmlFor="fechaLimite">Fecha límite</label>
          <input
            id="fechaLimite"
            type="date"
            min={hoyISO()}
            value={fechaLimite}
            onChange={(e) => {
              setFechaLimite(e.target.value);
              limpiar('fechaLimite');
            }}
            disabled={guardando}
          />
          <div className="form-help">
            <span className="form-error">{errores.fechaLimite}</span>
          </div>
        </div>

        <DestinatariosSelector
          alcance={alcance}
          onAlcance={(valor) => {
            setAlcance(valor);
            limpiar('destinatarios');
          }}
          seleccion={seleccion}
          onAlternar={alternarPlantel}
          planteles={planteles}
          cargando={cargandoPlanteles}
          disabled={guardando}
          error={errores.destinatarios}
        />

        <div className="form-actions">
          <Link to="/solicitudes" className="btn btn-outline">
            Cancelar
          </Link>
          <button type="submit" className="btn btn-primary" disabled={guardando}>
            <Send size={16} aria-hidden="true" />
            {guardando ? 'Enviando…' : 'Enviar solicitud'}
          </button>
        </div>
      </form>
    </>
  );
}
