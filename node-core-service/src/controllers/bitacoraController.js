const pool = require('../config/db');

const registrarAtencion = async (req, res) => {
  const { incidencia_id, tecnico_id, diagnostico, causa_raiz, tiempo_reparacion_min } = req.body;
  try {
    await pool.query('BEGIN');

    const queryBitacora = `
      INSERT INTO bitacora_mantenimiento (incidencia_id, tecnico_id, diagnostico, causa_raiz, tiempo_reparacion_min, fecha_cierre)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *;
    `;
    const bitacora = await pool.query(queryBitacora, [incidencia_id, tecnico_id, diagnostico, causa_raiz, tiempo_reparacion_min]);

    await pool.query("UPDATE incidencias SET estado = 'RESUELTA' WHERE id = $1", [incidencia_id]);

    await pool.query('COMMIT');
    res.status(201).json({ mensaje: 'Atención registrada y folio cerrado', bitacora: bitacora.rows[0] });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
};

const obtenerMetricasMttr = async (req, res) => {
  try {
    const result = await pool.query('SELECT AVG(tiempo_reparacion_min)::NUMERIC(10,2) AS mttr_promedio_minutos FROM bitacora_mantenimiento');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { registrarAtencion, obtenerMetricasMttr };