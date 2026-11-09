// P-08 · Publicar un formato nuevo o editar y sustituir uno existente (supervisión).
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import PageHeading from '../components/ui/PageHeading';
import Alert from '../components/ui/Alert';
import Loader from '../components/ui/Loader';
import SelectorArchivo from '../components/forms/SelectorArchivo';
import BotonDescarga from '../components/solicitudes/BotonDescarga';
import { useAuth } from '../hooks/useAuth';
import { CATEGORIAS } from '../constants/categorias';
import { actualizarFormato, obtenerFormato, publicarFormato } from '../services/formatosService';
import { EXTENSIONES_FORMATOS, validarArchivo } from '../services/storageService';
import { mensajeDeError } from '../utils/firebaseErrors';

export default function NuevoFormatoPage() {
  const { formatoId } = useParams();
  const editando = Boolean(formatoId);
  const { perfil } = useAuth();
  const navigate = useNavigate();

  const [formato, setFormato] = useState(null);
  const [cargando, setCargando] = useState(editando);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [progreso, setProgreso] = useState(null);

  useEffect(() => {
    if (!editando) return;
    obtenerFormato(formatoId)
      .then((f) => {
        if (!f) return setErrorGeneral('El formato no existe.');
        setFormato(f);
        setTitulo(f.titulo);
        setDescripcion(f.descripcion ?? '');
        setCategoria(f.categoria);
      })
      .catch((e) => setErrorGeneral(mensajeDeError(e)))
      .finally(() => setCargando(false));
  }, [editando, formatoId]);

  const validar = () => {
    const e = {};
    if (titulo.trim().length < 3) e.titulo = 'Escriba un título de al menos 3 caracteres.';
    if (!categoria) e.categoria = 'Seleccione una categoría.';
    if (!editando && !archivo) e.archivo = 'Seleccione el archivo del formato.';
    if (archivo) {
      const problema = validarArchivo(archivo, EXTENSIONES_FORMATOS);
      if (problema) e.archivo = problema;
    }
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const guardar = async (ev) => {
    ev.preventDefault();
    setErrorGeneral('');
    if (!validar()) return;
    setProgreso(archivo ? 0 : null);
    try {
      const datos = { titulo, descripcion, categoria, archivo, onProgreso: setProgreso };
      if (editando) await actualizarFormato(formato, datos);
      else await publicarFormato(datos, perfil);
      navigate('/formatos', { replace: true, state: { guardado: true } });
    } catch (e) {
      console.error('[guardar formato]', e);
      setErrorGeneral(mensajeDeError(e));
      setProgreso(null);
    }
  };

  if (cargando) return <Loader texto="Cargando formato…" />;
  const guardando = progreso !== null;

  return (
    <>
      <Link to="/formatos" className="back-link">
        <ArrowLeft size={16} aria-hidden="true" /> Volver al banco de formatos
      </Link>
      <PageHeading
        eyebrow={editando ? 'P-08 · EDITAR FORMATO' : 'P-08 · PUBLICAR FORMATO'}
        titulo={editando ? 'Editar o sustituir formato' : 'Publicar un formato'}
        descripcion={
          editando
            ? 'Cambie los datos o elija un archivo nuevo para reemplazar la versión actual.'
            : 'El formato quedará disponible para descarga en todos los planteles.'
        }
      />

      <form className="surface-card form-card" onSubmit={guardar} noValidate>
        {errorGeneral && <Alert tipo="error">{errorGeneral}</Alert>}

        <div className="form-field">
          <label htmlFor="titulo">Título</label>
          <input id="titulo" type="text" maxLength={150} value={titulo} disabled={guardando}
            placeholder="Ej. Formato de estadística de inicio de ciclo"
            onChange={(e) => setTitulo(e.target.value)} />
          <div className="form-help"><span className="form-error">{errores.titulo}</span><span>{titulo.length}/150</span></div>
        </div>

        <div className="form-field">
          <label htmlFor="descripcion">Descripción <span style={{ fontWeight: 400, color: '#94a3a6' }}>(opcional)</span></label>
          <textarea id="descripcion" maxLength={1000} value={descripcion} disabled={guardando} style={{ minHeight: 100 }}
            placeholder="Cuándo se usa y a quién se entrega."
            onChange={(e) => setDescripcion(e.target.value)} />
        </div>

        <div className="form-field" style={{ maxWidth: 360 }}>
          <label htmlFor="categoria">Categoría</label>
          <select id="categoria" className="form-select" value={categoria} disabled={guardando} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Seleccione…</option>
            {CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <div className="form-help"><span className="form-error">{errores.categoria}</span></div>
        </div>

        <div className="form-field">
          <span className="form-label">{editando ? 'Archivo actual' : 'Archivo'}</span>
          {editando && formato && <div style={{ marginBottom: 12 }}><BotonDescarga archivo={formato.archivo} /></div>}
          <SelectorArchivo
            archivo={archivo}
            onElegir={(f) => { setArchivo(f); setErrores((p) => ({ ...p, archivo: undefined })); }}
            extensiones={EXTENSIONES_FORMATOS}
            progreso={progreso}
            disabled={guardando}
            ayuda={editando ? 'Opcional: elija un archivo para sustituir la versión actual.' : 'PDF, Word, Excel o PowerPoint. Máximo 10 MB.'}
          />
          <div className="form-help"><span className="form-error">{errores.archivo}</span></div>
        </div>

        <div className="form-actions">
          <Link to="/formatos" className="btn btn-outline">Cancelar</Link>
          <button type="submit" className="btn btn-primary" disabled={guardando}>
            <Save size={16} aria-hidden="true" /> {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Publicar formato'}
          </button>
        </div>
      </form>
    </>
  );
}
