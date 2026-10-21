// Identidad de la plataforma (símbolo 072 + nombre).
export default function Brand({ inverse = false, small = false }) {
  return (
    <div className={`brand${inverse ? ' brand-inverse' : ''}`}>
      <div className={`brand-symbol${small ? ' brand-symbol-small' : ''}`}>072</div>
      <div>
        <strong>Supervisión Escolar 072</strong>
        <span>Educación Preescolar · Zona 072</span>
      </div>
    </div>
  );
}
