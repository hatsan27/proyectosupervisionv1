export default function EmptyState({ icono: Icono, titulo, children }) {
  return (
    <div className="surface-card placeholder-card" style={{ margin: '0 auto' }}>
      {Icono && (
        <div className="notice-icon">
          <Icono size={22} aria-hidden="true" />
        </div>
      )}
      <h2>{titulo}</h2>
      {children}
    </div>
  );
}
