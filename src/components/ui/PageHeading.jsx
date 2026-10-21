// Encabezado estándar de cada pantalla.
export default function PageHeading({ eyebrow, titulo, descripcion, children }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{titulo}</h1>
        {descripcion && <p>{descripcion}</p>}
      </div>
      {children}
    </div>
  );
}
