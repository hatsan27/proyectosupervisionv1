// Actividad 12 · Exportación del concentrado a Excel, PDF y Word, generada en el navegador.
// Las librerías se cargan solo al exportar para no hacer más pesada la carga inicial.

const nombreSeguro = (t) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60) || 'concentrado';

const descargar = (blob, nombre) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

const subtitulo = (c) =>
  `Supervisión Escolar 072 · Generado el ${c.generado} · Respondieron ${c.respondieron.length} de ${c.respondieron.length + c.pendientes.length} planteles`;

const secciones = (c) => [
  { titulo: 'Respuestas por plantel', ...c.general },
  ...c.tablas.map((t) => ({ ...t, titulo: t.titulo })),
];

// ---------- Excel (.xlsx) ----------
export const exportarExcel = async (c) => {
  const ExcelJS = (await import('exceljs')).default;
  const libro = new ExcelJS.Workbook();
  libro.creator = 'Supervisión Escolar 072';
  const usados = new Set();

  secciones(c).forEach((s, idx) => {
    let nombreHoja = (idx === 0 ? 'Concentrado' : s.titulo).replace(/[\\/*?:[\]]/g, ' ').slice(0, 28) || `Tabla ${idx}`;
    while (usados.has(nombreHoja)) nombreHoja = `${nombreHoja.slice(0, 25)} ${idx}`;
    usados.add(nombreHoja);
    const hoja = libro.addWorksheet(nombreHoja);

    hoja.addRow([c.titulo]).font = { bold: true, size: 14 };
    hoja.addRow([idx === 0 ? subtitulo(c) : s.titulo]).font = { italic: true, color: { argb: 'FF5F7B7F' } };
    hoja.addRow([]);
    const enc = hoja.addRow(s.headers);
    enc.eachCell((celda) => {
      celda.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF173E45' } };
      celda.alignment = { vertical: 'middle', wrapText: true };
    });
    s.rows.forEach((r) => hoja.addRow(r.map((v) => (v !== '' && Number.isFinite(Number(v)) ? Number(v) : v))));
    if (s.totales) {
      const t = hoja.addRow(s.totales.map((v) => (v !== '' && Number.isFinite(Number(v)) ? Number(v) : v)));
      t.font = { bold: true };
    }
    hoja.columns.forEach((col, i) => {
      const largo = Math.max(...[s.headers[i] ?? '', ...s.rows.map((r) => r[i] ?? '')].map((v) => String(v).length));
      col.width = Math.min(Math.max(largo + 2, 12), 50);
    });
    if (idx === 0 && c.pendientes.length) {
      hoja.addRow([]);
      hoja.addRow(['Planteles pendientes:', c.pendientes.join(', ')]).font = { italic: true };
    }
  });

  const buffer = await libro.xlsx.writeBuffer();
  descargar(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${nombreSeguro(c.titulo)}.xlsx`,
  );
};

// ---------- PDF ----------
export const exportarPDF = async (c) => {
  const { jsPDF } = await import('jspdf');
  const mod = await import('jspdf-autotable');
  const autoTable = mod.autoTable ?? mod.default;
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });

  pdf.setFontSize(15);
  pdf.text(c.titulo, 40, 44);
  pdf.setFontSize(9);
  pdf.setTextColor(95, 123, 127);
  pdf.text(subtitulo(c), 40, 60);
  pdf.setTextColor(0);
  let y = 76;

  secciones(c).forEach((s) => {
    if (y > 500) {
      pdf.addPage();
      y = 44;
    }
    pdf.setFontSize(11);
    pdf.text(s.titulo, 40, y + 8);
    autoTable(pdf, {
      startY: y + 16,
      head: [s.headers],
      body: s.rows.length ? s.rows : [[{ content: 'Sin respuestas', colSpan: s.headers.length }]],
      foot: s.totales ? [s.totales] : undefined,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [23, 62, 69] },
      footStyles: { fillColor: [238, 244, 243], textColor: 20, fontStyle: 'bold' },
      margin: { left: 40, right: 40 },
    });
    y = pdf.lastAutoTable.finalY + 26;
  });

  if (c.pendientes.length) {
    pdf.setFontSize(9);
    pdf.text(`Planteles pendientes: ${c.pendientes.join(', ')}`, 40, Math.min(y, 570), { maxWidth: 700 });
  }
  pdf.save(`${nombreSeguro(c.titulo)}.pdf`);
};

// ---------- Word (.docx) ----------
export const exportarWord = async (c) => {
  const d = await import('docx');
  const ANCHO = 12960; // carta horizontal con márgenes de 0.75" (en DXA)

  const celda = (texto, { encabezado = false, total = false, ancho } = {}) =>
    new d.TableCell({
      width: { size: ancho, type: d.WidthType.DXA },
      shading: encabezado
        ? { fill: '173E45', type: d.ShadingType.CLEAR, color: 'auto' }
        : total
          ? { fill: 'EEF4F3', type: d.ShadingType.CLEAR, color: 'auto' }
          : undefined,
      margins: { top: 60, bottom: 60, left: 90, right: 90 },
      children: [
        new d.Paragraph({
          children: [new d.TextRun({ text: String(texto ?? ''), bold: encabezado || total, color: encabezado ? 'FFFFFF' : '1F3338', size: 18, font: 'Arial' })],
        }),
      ],
    });

  const tabla = (s) => {
    const n = s.headers.length;
    const anchos = Array(n).fill(Math.floor(ANCHO / n));
    anchos[n - 1] += ANCHO - anchos.reduce((a, b) => a + b, 0);
    const filas = [
      new d.TableRow({ tableHeader: true, children: s.headers.map((h, i) => celda(h, { encabezado: true, ancho: anchos[i] })) }),
      ...(s.rows.length ? s.rows : [['Sin respuestas', ...Array(n - 1).fill('')]]).map(
        (r) => new d.TableRow({ children: r.map((v, i) => celda(v, { ancho: anchos[i] })) }),
      ),
    ];
    if (s.totales) filas.push(new d.TableRow({ children: s.totales.map((v, i) => celda(v, { total: true, ancho: anchos[i] })) }));
    return new d.Table({ width: { size: ANCHO, type: d.WidthType.DXA }, columnWidths: anchos, rows: filas });
  };

  const hijos = [
    new d.Paragraph({ children: [new d.TextRun({ text: c.titulo, bold: true, size: 30, font: 'Arial' })], spacing: { after: 80 } }),
    new d.Paragraph({ children: [new d.TextRun({ text: subtitulo(c), italics: true, size: 18, color: '5F7B7F', font: 'Arial' })], spacing: { after: 240 } }),
  ];
  secciones(c).forEach((s) => {
    hijos.push(new d.Paragraph({ children: [new d.TextRun({ text: s.titulo, bold: true, size: 22, font: 'Arial' })], spacing: { before: 200, after: 100 } }));
    hijos.push(tabla(s));
  });
  if (c.pendientes.length) {
    hijos.push(new d.Paragraph({ children: [new d.TextRun({ text: `Planteles pendientes: ${c.pendientes.join(', ')}`, italics: true, size: 18, font: 'Arial' })], spacing: { before: 240 } }));
  }

  const documento = new d.Document({
    creator: 'Supervisión Escolar 072',
    title: c.titulo,
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840, orientation: d.PageOrientation.LANDSCAPE },
          margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 },
        },
      },
      children: hijos,
    }],
  });
  descargar(await d.Packer.toBlob(documento), `${nombreSeguro(c.titulo)}.docx`);
};
