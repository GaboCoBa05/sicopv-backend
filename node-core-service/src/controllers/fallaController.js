const db = require('../config/db');

exports.reportarFalla = async (req, res) => {
  const { equipo_id, usuario_id, tipo_falla, descripcion } = req.body;
  const folio = `FOL-${Date.now().toString().slice(-6)}`;
  try {
    const result = await db.query(
      `INSERT INTO fallas (folio_incidencia, equipo_id, usuario_id, tipo_falla, descripcion)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [folio, equipo_id, usuario_id, tipo_falla, descripcion]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.obtenerFallas = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT f.*, e.nombre AS equipo_nombre, e.numero_serie, u.usuario AS reportado_por
      FROM fallas f
      JOIN equipos e ON f.equipo_id = e.id
      LEFT JOIN usuarios u ON f.usuario_id = u.id
      ORDER BY f.fecha_reporte DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.actualizarEstatusFalla = async (req, res) => {
  const { id } = req.params;
  const { estatus } = req.body;
  try {
    const result = await db.query(
      'UPDATE fallas SET estatus = $1 WHERE id = $2 RETURNING *',
      [estatus, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};