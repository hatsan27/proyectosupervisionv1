export default function Loader({ texto = 'Cargando…', pantallaCompleta = false }) {
  return (
    <div className={`splash${pantallaCompleta ? ' splash-full' : ''}`}>
      <div className="splash-inner">
        <div className="spinner" aria-hidden="true" />
        <span>{texto}</span>
      </div>
    </div>
  );
}
