const PDFDocument = require('pdfkit');
const { query } = require('../config/db');

function val(valor, defecto = 'No registrado') {
  if (valor === null || valor === undefined || String(valor).trim() === '') return defecto;
  return valor;
}

// GET /api/reportes/pdf/:folio
exports.generarReportePDF = async (req, res) => {
  try {
    const { folio } = req.params;
    const folioNormalizado = String(folio || '').trim().toUpperCase();

    if (!folioNormalizado) {
      return res.status(400).json({ error: 'Debe indicar el folio de la falla.' });
    }

    const sql = `
      SELECT f.folio, f.tipo_falla, f.descripcion AS falla_desc, f.prioridad, f.estado, f.fecha_reporte,
             e.nombre AS equipo_nombre, e.numero_serie, e.ubicacion_area, e.codigo_qr,
             rb.tiempo_reparacion_min, rb.causa_raiz, rb.refacciones_empleadas, rb.fecha_fin,
             u.nombre_usuario AS tecnico_nombre, t.area AS tecnico_area, t.especialidad AS tecnico_especialidad
      FROM fallas f
      LEFT JOIN equipos e ON f.equipo_id = e.id
      LEFT JOIN reparacion_bitacora rb ON rb.falla_id = f.id
      LEFT JOIN tecnicos t ON rb.tecnico_id = t.id
      LEFT JOIN usuarios u ON t.usuario_id = u.id
      WHERE UPPER(f.folio) = $1
      LIMIT 1
    `;
    const result = await query(sql, [folioNormalizado]);

    if (!result || result.rows.length === 0) {
      return res.status(404).json({ error: `No se encontró información para el folio ${folioNormalizado}` });
    }

    const reporteData = result.rows[0];

    if (reporteData.tiempo_reparacion_min === null) {
      return res.status(409).json({ error: `La falla ${folioNormalizado} aún no tiene bitácora de cierre registrada.` });
    }

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Reporte_${folioNormalizado}.pdf"`);

    doc.pipe(res);

    // Encabezado corporativo
    doc.rect(40, 40, 515, 60).fill('#0b4548');
    doc.fillColor('#ffffff').fontSize(18).text('TSR SALTILLO • SiCoPV / AFYP', 55, 52);
    doc.fontSize(11).text('REPORTE TÉCNICO DE CIERRE DE INCIDENCIA EN PLANTA', 55, 75);

    doc.fillColor('#10484b').fontSize(10);

    // Cuadro de resumen superior
    let y = 120;
    doc.fontSize(12).font('Helvetica-Bold').text(`FOLIO DE INCIDENCIA: ${reporteData.folio}`, 40, y);
    doc.fontSize(10).font('Helvetica').text(`Estado del Ticket: ${val(reporteData.estado)} | Prioridad: ${val(reporteData.prioridad)}`, 320, y);

    y += 24;
    doc.moveTo(40, y).lineTo(555, y).strokeColor('#cad7dc').stroke();

    // Sección 1: Equipo
    y += 14;
    doc.fillColor('#0b4548').fontSize(12).font('Helvetica-Bold').text('1. INFORMACIÓN DEL EQUIPO INDUSTRIAL', 40, y);
    y += 18;
    doc.fillColor('#333333').fontSize(10).font('Helvetica');
    doc.text(`Nombre de la Máquina: ${val(reporteData.equipo_nombre)}`, 45, y);
    doc.text(`Número de Serie: ${val(reporteData.numero_serie)}`, 320, y);
    y += 16;
    doc.text(`Ubicación / Celda: ${val(reporteData.ubicacion_area)}`, 45, y);
    doc.text(`Código QR de Identificación: ${val(reporteData.codigo_qr)}`, 320, y);

    // Sección 2: Falla reportada
    y += 24;
    doc.moveTo(40, y).lineTo(555, y).stroke();
    y += 14;
    doc.fillColor('#0b4548').fontSize(12).font('Helvetica-Bold').text('2. DETALLES DE LA FALLA OPERATIVA', 40, y);
    y += 18;
    doc.fillColor('#333333').fontSize(10).font('Helvetica');
    doc.text(`Tipo de Falla: ${val(reporteData.tipo_falla)}`, 45, y);
    doc.text(`Fecha y Hora de Reporte: ${new Date(reporteData.fecha_reporte).toLocaleString()}`, 320, y);
    y += 16;
    doc.text(`Descripción Reportada: ${val(reporteData.falla_desc)}`, 45, y, { width: 490 });

    // Sección 3: Intervención técnica
    y += 40;
    doc.moveTo(40, y).lineTo(555, y).stroke();
    y += 14;
    doc.fillColor('#0b4548').fontSize(12).font('Helvetica-Bold').text('3. INTERVENCIÓN TÉCNICA Y DIAGNÓSTICO', 40, y);
    y += 18;
    doc.fillColor('#333333').fontSize(10).font('Helvetica');
    doc.text(`Técnico Especialista: ${val(reporteData.tecnico_nombre)} (${val(reporteData.tecnico_area)})`, 45, y);
    doc.text(`Tiempo de Paro / Reparación: ${reporteData.tiempo_reparacion_min} minutos`, 320, y);
    y += 16;
    doc.font('Helvetica-Bold').text('Causa Raíz Diagnosticada:', 45, y);
    y += 14;
    doc.font('Helvetica').text(val(reporteData.causa_raiz), 45, y, { width: 490 });
    y += 26;
    doc.font('Helvetica-Bold').text('Refacciones Empleadas:', 45, y);
    y += 14;
    doc.font('Helvetica').text(val(reporteData.refacciones_empleadas), 45, y, { width: 490 });

    // Firmas y pie
    y = 700;
    doc.moveTo(60, y).lineTo(230, y).stroke();
    doc.moveTo(340, y).lineTo(510, y).stroke();
    y += 8;
    doc.fontSize(9).text('Firma del Técnico Especialista', 75, y);
    doc.text('Supervisión de Mantenimiento', 360, y);

    y += 30;
    doc.fontSize(8).fillColor('#777777').text(
      'Documento oficial generado por la plataforma SiCoPV / AFYP - TSR Saltillo.',
      40, y, { align: 'center', width: 515 }
    );

    doc.end();

  } catch (error) {
    console.error('[reporteController.generarReportePDF Error]', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Error al generar el reporte en PDF.' });
    }
    res.end();
  }
};
