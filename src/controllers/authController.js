const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.registrarUsuario = async (req, res) => {
  const { usuario, telefono, email, password, rol, area, especialidad } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await db.query(
      `INSERT INTO usuarios (usuario, telefono, email, password_hash, rol, area, especialidad)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, usuario, email, rol`,
      [usuario, telefono, email, password_hash, rol || 'OPERADOR', area, especialidad]
    );

    res.status(201).json({ mensaje: 'Usuario registrado con éxito', usuario: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const { usuario, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM usuarios WHERE usuario = $1 OR email = $1', [usuario]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];
    const passValido = await bcrypt.compare(password, user.password_hash);
    if (!passValido) {
      return res.status(400).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: user.id, usuario: user.usuario, rol: user.rol },
      process.env.JWT_SECRET || 'secreto_vibecode_sicopv_2026',
      { expiresIn: '8h' }
    );

    res.json({ mensaje: 'Login exitoso', token, usuario: { id: user.id, nombre: user.usuario, rol: user.rol } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};