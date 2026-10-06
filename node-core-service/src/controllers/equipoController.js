const db = require('../config/db');

exports.obtenerEquipos = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT e.*, u.area_equipo 
      FROM equipos e 
      LEFT JOIN ubicaciones u ON e.ubicacion_id = u.id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.crearEquipo = async (req, res) => {
  const { numero_serie, nombre, ubicacion_id, descripcion, codigo_qr } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO equipos (numero_serie, nombre, ubicacion_id, descripcion, codigo_qr)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [numero_serie, nombre, ubicacion_id, descripcion, codigo_qr || numero_serie]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.obtenerEquipoPorSerie = async (req, res) => {
  const { serie } = req.params;
  try {
    const result = await db.query('SELECT * FROM equipos WHERE numero_serie = $1', [serie]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};