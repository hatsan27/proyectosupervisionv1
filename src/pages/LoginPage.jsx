// P-01 · Inicio de sesión (RF-01)
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import Brand from '../components/ui/Brand';
import Alert from '../components/ui/Alert';
import Loader from '../components/ui/Loader';
import { useAuth } from '../hooks/useAuth';
import { iniciarSesion } from '../services/authService';
import { mensajeDeError } from '../utils/firebaseErrors';

export default function LoginPage() {
  const { estado, errorAcceso, limpiarError } = useAuth();
  const location = useLocation();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [verContrasena, setVerContrasena] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  // Mensaje cuando la cuenta no tiene perfil autorizado o está inactiva.
  useEffect(() => {
    if (errorAcceso) {
      setError(errorAcceso);
      setEnviando(false);
    }
  }, [errorAcceso]);

  if (estado === 'autenticado') {
    return <Navigate to={location.state?.desde ?? '/panel'} replace />;
  }
  if (estado === 'cargando' && !enviando) {
    return <Loader pantallaCompleta texto="Verificando sesión…" />;
  }

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    limpiarError();
    if (!correo.trim() || !contrasena) {
      setError('Escriba su correo y su contraseña.');
      return;
    }
    setEnviando(true);
    try {
      await iniciarSesion(correo, contrasena);
      // El contexto carga el perfil y esta pantalla redirige al panel.
    } catch (err) {
      setError(mensajeDeError(err));
      setEnviando(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-intro">
        <div className="login-intro-inner">
          <Brand inverse />
          <div className="login-main-copy">
            <span className="login-kicker">PLATAFORMA DE GESTIÓN ADMINISTRATIVA</span>
            <h1>Un espacio para organizar la información escolar.</h1>
            <p>
              Avisos, solicitudes, formatos y captura de información de la Zona Escolar 072 en un solo
              lugar, desde la computadora o el celular.
            </p>
            <span className="login-tag">
              <ShieldCheck size={16} aria-hidden="true" /> Acceso personal para supervisión y planteles
            </span>
          </div>
          <div className="login-intro-foot">Huetamo, Michoacán · 2026</div>
        </div>
        <div className="login-pattern" aria-hidden="true">
          <div />
          <div />
          <div />
        </div>
      </section>

      <section className="login-form-section">
        <div className="login-form-wrap">
          <div className="login-form-header">
            <div className="form-icon">
              <Lock size={22} aria-hidden="true" />
            </div>
            <div className="eyebrow">INICIO DE SESIÓN</div>
            <h2>Bienvenida a la plataforma</h2>
            <p>Escriba el correo y la contraseña que le proporcionó la Supervisión.</p>
          </div>

          {error && <Alert tipo="error">{error}</Alert>}

          <form className="login-form" onSubmit={enviar} noValidate>
            <label htmlFor="correo">Correo electrónico</label>
            <div className="input-icon-wrap">
              <Mail size={17} aria-hidden="true" />
              <input
                id="correo"
                type="email"
                autoComplete="username"
                placeholder="nombre@correo.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                disabled={enviando}
              />
            </div>

            <label htmlFor="contrasena">Contraseña</label>
            <div className="input-icon-wrap">
              <Lock size={17} aria-hidden="true" />
              <input
                id="contrasena"
                type={verContrasena ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Su contraseña"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                disabled={enviando}
              />
              <button
                type="button"
                className="input-aux"
                onClick={() => setVerContrasena((v) => !v)}
                aria-label={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {verContrasena ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button type="submit" className="btn btn-primary login-submit" disabled={enviando}>
              <span>{enviando ? 'Entrando…' : 'Entrar'}</span>
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </form>

          <p className="login-footnote" style={{ marginTop: 22 }}>
            ¿Olvidó su contraseña o no tiene cuenta? Comuníquese con la Supervisión Escolar 072.
          </p>
        </div>
      </section>
    </div>
  );
}
