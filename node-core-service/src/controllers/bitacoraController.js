const db = require('../config/db');

exports.iniciarReparacion = async (req, res) => {
  const { folio_incidencia, tecnico_id } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO bitacora (folio_incidencia, tecnico_id, tiempo_inicio_reparacion, estado)
       VALUES ($1, $2, CURRENT_TIMESTAMP, 'EN_PROCESO')
       ON CONFLICT (folio_incidencia) 
       DO UPDATE SET tiempo_inicio_reparacion = CURRENT_TIMESTAMP, estado = 'EN_PROCESO'
       RETURNING *`,
      [folio_incidencia, tecnico_id]
    );

    await db.query(`UPDATE fallas SET estatus = 'EN_PROCESO' WHERE folio_incidencia = $1`, [folio_incidencia]);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.finalizarReparacion = async (req, res) => {
  const { folio_incidencia, causa_raiz, fotografia_url } = req.body;
  try {
    const result = await db.query(
      `UPDATE bitacora 
       SET tiempo_fin_reparacion = CURRENT_TIMESTAMP, causa_raiz = $1, fotografia_url = $2, estado = 'SOLUCIONADA'
       WHERE folio_incidencia = $3 RETURNING *`,
      [causa_raiz, fotografia_url, folio_incidencia]
    );

    await db.query(`UPDATE fallas SET estatus = 'SOLUCIONADA' WHERE folio_incidencia = $1`, [folio_incidencia]);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.obtenerMetricas = async (req, res) => {
  try {
    const mttrResult = await db.query(`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (tiempo_fin_reparacion - tiempo_inicio_reparacion))/60) AS mttr_minutos
      FROM bitacora 
      WHERE estado = 'SOLUCIONADA'
    `);

    res.json({
      mttr_promedio_minutos: parseFloat(mttrResult.rows[0].mttr_minutos || 0).toFixed(2),
      unidad: 'Minutos'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};