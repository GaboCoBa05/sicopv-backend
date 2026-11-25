const { pool, query } = require('../config/db');

// Resuelve el técnico asociado al usuario autenticado (si existe).
async function resolverTecnicoId(usuarioId) {
  if (!usuarioId) return null;
  const res = await query('SELECT id FROM tecnicos WHERE usuario_id = $1 LIMIT 1', [usuarioId]);
  return res && res.rows.length > 0 ? res.rows[0].id : null;
}

// POST /api/bitacora
exports.registrarBitacora = async (req, res) => {
  let client = null;
  try {
    client = await pool.connect();
    const {
      falla_id,
      tecnico_id,
      tiempo_reparacion_min,
      causa_raiz,
      refacciones_empleadas
    } = req.body;

    if (!falla_id || !causa_raiz || !refacciones_empleadas) {
      return res.status(400).json({
        error: 'RELLENAR TODOS LOS CAMPOS: Falla, Causa raíz y Refacciones empleadas son obligatorios.'
      });
    }

    const tiempoMin = parseInt(tiempo_reparacion_min || 0, 10);
    if (isNaN(tiempoMin) || tiempoMin < 0) {
      return res.status(400).json({
        error: 'El tiempo de reparación debe ser un valor numérico válido (en minutos).'
      });
    }

    const resF = await client.query('SELECT id, equipo_id, folio FROM fallas WHERE id = $1', [parseInt(falla_id, 10)]);
    if (resF.rows.length === 0) {
      return res.status(404).json({ error: 'La falla especificada no existe.' });
    }
    const falla = resF.rows[0];

    const yaCerrada = await client.query('SELECT id FROM reparacion_bitacora WHERE falla_id = $1', [falla.id]);
    if (yaCerrada.rows.length > 0) {
      return res.status(409).json({ error: 'Esta falla ya cuenta con una bitácora de cierre registrada.' });
    }

    const tecnicoFinal = tecnico_id
      ? parseInt(tecnico_id, 10)
      : await resolverTecnicoId(req.usuario && req.usuario.id);

    await client.query('BEGIN');

    const resBit = await client.query(
      `INSERT INTO reparacion_bitacora (falla_id, tecnico_id, fecha_inicio, fecha_fin, tiempo_reparacion_min, causa_raiz, refacciones_empleadas)
       VALUES ($1, $2, NOW() - ($3 * INTERVAL '1 minute'), NOW(), $3, $4, $5)
       RETURNING *`,
      [falla.id, tecnicoFinal, tiempoMin, causa_raiz.trim(), refacciones_empleadas.trim()]
    );

    await client.query("UPDATE fallas SET estado = 'CERRADA' WHERE id = $1", [falla.id]);
    await client.query("UPDATE equipos SET estado = 'OPERATIVO' WHERE id = $1", [falla.equipo_id]);

    await client.query('COMMIT');

    const registro = resBit.rows[0];
    console.log(`[bitacoraController] Bitácora guardada para falla ${falla.folio}. Equipo restablecido a OPERATIVO.`);

    return res.status(201).json({
      message: 'Reparación finalizada. Bitácora actualizada y equipo restaurado a OPERATIVO.',
      bitacora: registro
    });

  } catch (error) {
    if (client) {
      try { await client.query('ROLLBACK'); } catch (e) { /* sin transacción activa */ }
    }
    console.error('[bitacoraController.registrarBitacora Error]', error);
    return res.status(500).json({ error: 'Error al registrar la bitácora de reparación.' });
  } finally {
    if (client) client.release();
  }
};

// GET /api/bitacora
exports.listarBitacoras = async (req, res) => {
  try {
    const sql = `
      SELECT rb.*, f.folio, f.tipo_falla, f.descripcion AS falla_descripcion, f.estado AS falla_estado,
             e.nombre AS equipo_nombre, e.numero_serie, u.nombre_usuario AS tecnico_nombre
      FROM reparacion_bitacora rb
      JOIN fallas f ON rb.falla_id = f.id
      LEFT JOIN equipos e ON f.equipo_id = e.id
      LEFT JOIN tecnicos t ON rb.tecnico_id = t.id
      LEFT JOIN usuarios u ON t.usuario_id = u.id
      ORDER BY rb.fecha_fin DESC
    `;
    const result = await query(sql);
    return res.status(200).json(result.rows);

  } catch (error) {
    console.error('[bitacoraController.listarBitacoras Error]', error);
    return res.status(500).json({ error: 'Error al consultar historial de bitácoras.' });
  }
};

// PUT /api/bitacora/:id  (SOLO ADMIN)
exports.actualizarBitacora = async (req, res) => {
  try {
    const { id } = req.params;
    const { tiempo_reparacion_min, causa_raiz, refacciones_empleadas } = req.body;

    const result = await query(
      `UPDATE reparacion_bitacora
       SET tiempo_reparacion_min = COALESCE($1, tiempo_reparacion_min),
           causa_raiz = COALESCE($2, causa_raiz),
           refacciones_empleadas = COALESCE($3, refacciones_empleadas)
       WHERE id = $4 RETURNING id`,
      [tiempo_reparacion_min || null, causa_raiz || null, refacciones_empleadas || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bitácora no encontrada.' });
    }

    return res.status(200).json({ message: 'Bitácora actualizada correctamente.' });
  } catch (error) {
    console.error('[bitacoraController.actualizarBitacora Error]', error);
    return res.status(500).json({ error: 'Error al actualizar la bitácora.' });
  }
};

// DELETE /api/bitacora/:id  (SOLO ADMIN)
exports.eliminarBitacora = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM reparacion_bitacora WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bitácora no encontrada.' });
    }

    return res.status(200).json({ message: 'Bitácora eliminada correctamente.' });
  } catch (error) {
    console.error('[bitacoraController.eliminarBitacora Error]', error);
    return res.status(500).json({ error: 'Error al eliminar la bitácora.' });
  }
};
