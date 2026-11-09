// Categorías del banco de formatos (actividad 10). Pueden ajustarse con la supervisora.
export const CATEGORIAS = [
  { id: 'planeacion', label: 'Planeación' },
  { id: 'estadistica', label: 'Estadística' },
  { id: 'control-escolar', label: 'Control escolar' },
  { id: 'administrativo', label: 'Administrativo' },
  { id: 'otros', label: 'Otros' },
];

export const CATEGORIA_LABELS = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c.label]));
