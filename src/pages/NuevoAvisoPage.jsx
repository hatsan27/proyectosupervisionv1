// P-04 · Nuevo aviso (solo supervisora, RF-03).
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import PageHeading from '../components/ui/PageHeading';
import Alert from '../components/ui/Alert';
import DestinatariosSelector from '../components/forms/DestinatariosSelector';
import { useAuth } from '../hooks/useAuth';
import { usePlanteles } from '../hooks/usePlanteles';
import { publicarAviso } from '../services/avisosService';
import { DESTINO_TODOS } from '../constants/roles';
import { mensajeDeError } from '../utils/firebaseErrors';

const MAX_TITULO = 150;
const MAX_CONTENIDO = 5000;

export default function NuevoAvisoPage() {
  const { perfil } = useAuth();
  const { planteles, cargando: cargandoPlanteles } = usePlanteles();
  const navigate = useNavigate();

  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [alcance, setAlcance] = useState('todos'); // 'todos' | 'seleccion'
  const [seleccion, setSeleccion] = useState([]);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [publicando, setPublicando] = useState(false);

  // Quita el mensaje de error de un campo en cuanto la usuaria lo corrige.
  const limpiar = (campo) => errores[campo] && setErrores((prev) => ({ ...prev, [campo]: undefined }));

  const alternarPlantel = (id) => {
    limpiar('destinatarios');
    setSeleccion((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const validar = () => {
    const e = {};
    if (titulo.trim().length < 3) e.titulo = 'Escriba un título de al menos 3 caracteres.';
    if (contenido.trim().length < 3) e.contenido = 'Escriba el contenido del aviso.';
    if (alcance === 'seleccion' && seleccion.length === 0) e.destinatarios = 'Seleccione al menos un plantel.';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const enviar = async (ev) => {
    ev.preventDefault();
    setErrorGeneral('');
    if (!validar()) return;

    setPublicando(true);
    try {
      const destinatarios = alcance === 'todos' ? [DESTINO_TODOS] : seleccion;
      await publicarAviso({ titulo, contenido, destinatarios }, perfil);
      navigate('/avisos', { replace: true, state: { publicado: true } });
    } catch (err) {
      console.error('[publicar aviso]', err);
      setErrorGeneral(mensajeDeError(err));
      setPublicando(false);
    }
  };

  return (
    <>
      <Link to="/avisos" className="back-link">
        <ArrowLeft size={16} aria-hidden="true" /> Volver a avisos
      </Link>

      <PageHeading
        eyebrow="P-04 · NUEVO AVISO"
        titulo="Publicar un aviso"
        descripcion="Escriba el comunicado y elija a qué planteles va dirigido."
      />

      <form className="surface-card form-card" onSubmit={enviar} noValidate>
        {errorGeneral && <Alert tipo="error">{errorGeneral}</Alert>}

        <div className="form-field">
          <label htmlFor="titulo">Título</label>
          <input
            id="titulo"
            type="text"
            maxLength={MAX_TITULO}
            placeholder="Ej. Reunión de directoras del viernes"
            value={titulo}
            onChange={(e) => {
              setTitulo(e.target.value);
              limpiar('titulo');
            }}
            disabled={publicando}
          />
          <div className="form-help">
            <span className="form-error">{errores.titulo}</span>
            <span>
              {titulo.length}/{MAX_TITULO}
            </span>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="contenido">Contenido</label>
          <textarea
            id="contenido"
            maxLength={MAX_CONTENIDO}
            placeholder="Escriba aquí el texto completo del aviso."
            value={contenido}
            onChange={(e) => {
              setContenido(e.target.value);
              limpiar('contenido');
            }}
            disabled={publicando}
          />
          <div className="form-help">
            <span className="form-error">{errores.contenido}</span>
            <span>
              {contenido.length}/{MAX_CONTENIDO}
            </span>
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
          disabled={publicando}
          error={errores.destinatarios}
        />

        <div className="form-actions">
          <Link to="/avisos" className="btn btn-outline">
            Cancelar
          </Link>
          <button type="submit" className="btn btn-primary" disabled={publicando}>
            <Send size={16} aria-hidden="true" />
            {publicando ? 'Publicando…' : 'Publicar aviso'}
          </button>
        </div>
      </form>
    </>
  );
}
