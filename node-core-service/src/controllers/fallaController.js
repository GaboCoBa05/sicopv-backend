const pool = require('../config/db');

const reportarFalla = async (req, res) => {
  const { equipo_id, usuario_reporta_id, descripcion_falla, prioridad } = req.body;
  try {
    const folio = `FOL-${Math.floor(100000 + Math.random() * 900000)}`;
    const query = `
      INSERT INTO incidencias (folio, equipo_id, usuario_reporta_id, descripcion_falla, prioridad, estado, fecha_reporte)
      VALUES ($1, $2, $3, $4, $5, 'ABIERTA', NOW())
      RETURNING *;
    `;
    const values = [folio, equipo_id, usuario_reporta_id, descripcion_falla, prioridad || 'MEDIA'];
    const result = await pool.query(query, values);

    res.status(201).json({ mensaje: 'Falla registrada correctamente', incidencia: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const obtenerFallas = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM incidencias ORDER BY fecha_reporte DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { reportarFalla, obtenerFallas };