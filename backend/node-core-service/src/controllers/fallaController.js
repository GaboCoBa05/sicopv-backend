const { query } = require('../config/db');

// POST /api/fallas
exports.crearFalla = async (req, res) => {
  try {
    const {
      equipo_id,
      tipo_falla,
      descripcion,
      descripcion_adicional,
      prioridad,
      usuario_reporta_id
    } = req.body;

    if (!equipo_id || !tipo_falla || !descripcion || !prioridad) {
      return res.status(400).json({
        error: 'Los campos equipo_id, tipo_falla, descripcion y prioridad son obligatorios.'
      });
    }

    const prioridadNorm = String(prioridad).toUpperCase();
    const prioridadesValidas = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];
    const pFinal = prioridadesValidas.includes(prioridadNorm) ? prioridadNorm : 'MEDIA';

    const equipo = await query('SELECT id FROM equipos WHERE id = $1', [parseInt(equipo_id, 10)]);
    if (!equipo || equipo.rows.length === 0) {
      return res.status(404).json({ error: 'El equipo especificado no existe.' });
    }

    const usuarioReporta = usuario_reporta_id
      ? parseInt(usuario_reporta_id, 10)
      : (req.usuario && req.usuario.id) || null;

    // Generación de folio único FOL-XXXXXX
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const folio = `FOL-${randomSuffix}`;

    const sqlFalla = `
      INSERT INTO fallas (folio, equipo_id, usuario_reporta_id, tipo_falla, descripcion, descripcion_adicional, prioridad, estado)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'ABIERTA')
      RETURNING *
    `;
    const resFalla = await query(sqlFalla, [
      folio,
      parseInt(equipo_id, 10),
      usuarioReporta,
      tipo_falla,
      descripcion,
      descripcion_adicional || null,
      pFinal
    ]);

    await query("UPDATE equipos SET estado = 'EN_PARO' WHERE id = $1", [parseInt(equipo_id, 10)]);

    const nuevaFalla = resFalla.rows[0];
    console.log(`[fallaController] Falla reportada: Folio ${folio} -> Equipo ${equipo_id} (Estado: EN_PARO)`);

    return res.status(201).json({
      message: 'Falla registrada exitosamente. Equipo marcado en paro.',
      folio: nuevaFalla.folio,
      falla: nuevaFalla
    });

  } catch (error) {
    console.error('[fallaController.crearFalla Error]', error);
    return res.status(500).json({ error: 'Error interno al registrar el reporte de falla.' });
  }
};

// GET /api/fallas
exports.listarFallas = async (req, res) => {
  try {
    const sql = `
      SELECT f.*, e.nombre AS equipo_nombre, e.numero_serie, e.ubicacion_area, u.nombre_usuario AS reportado_por
      FROM fallas f
      LEFT JOIN equipos e ON f.equipo_id = e.id
      LEFT JOIN usuarios u ON f.usuario_reporta_id = u.id
      ORDER BY f.fecha_reporte DESC
    `;
    const result = await query(sql);
    return res.status(200).json(result.rows);

  } catch (error) {
    console.error('[fallaController.listarFallas Error]', error);
    return res.status(500).json({ error: 'Error al consultar las fallas.' });
  }
};

// PUT /api/fallas/:id  (SOLO ADMIN)
exports.actualizarFalla = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo_falla, descripcion, descripcion_adicional, prioridad, estado } = req.body;

    const result = await query(
      `UPDATE fallas
       SET tipo_falla = COALESCE($1, tipo_falla),
           descripcion = COALESCE($2, descripcion),
           descripcion_adicional = COALESCE($3, descripcion_adicional),
           prioridad = COALESCE($4, prioridad),
           estado = COALESCE($5, estado)
       WHERE id = $6 RETURNING id`,
      [tipo_falla || null, descripcion || null, descripcion_adicional || null,
       prioridad ? String(prioridad).toUpperCase() : null, estado ? String(estado).toUpperCase() : null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Falla no encontrada.' });
    }

    return res.status(200).json({ message: 'Falla actualizada correctamente.' });
  } catch (error) {
    console.error('[fallaController.actualizarFalla Error]', error);
    return res.status(500).json({ error: 'Error al actualizar la falla.' });
  }
};

// DELETE /api/fallas/:id  (SOLO ADMIN)
exports.eliminarFalla = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM fallas WHERE id = $1 RETURNING id, equipo_id, estado', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Falla no encontrada.' });
    }

    const eliminada = result.rows[0];
    if (eliminada.estado !== 'CERRADA') {
      await query(
        `UPDATE equipos
         SET estado = 'OPERATIVO'
         WHERE id = $1 AND estado = 'EN_PARO'
           AND NOT EXISTS (
             SELECT 1 FROM fallas WHERE equipo_id = $1 AND estado IN ('ABIERTA', 'EN_PROCESO')
           )`,
        [eliminada.equipo_id]
      );
    }

    return res.status(200).json({ message: 'Falla eliminada correctamente.' });
  } catch (error) {
    console.error('[fallaController.eliminarFalla Error]', error);
    return res.status(500).json({ error: 'Error al eliminar la falla.' });
  }
};
