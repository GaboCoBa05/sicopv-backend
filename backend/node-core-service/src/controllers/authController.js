const jwt = require('jsonwebtoken');
const { query, memoriaDB, isPostgresConnected } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_vibecode_sicopv_2026';

exports.login = async (req, res) => {
  try {
    const correo = (req.body.email || req.body.correo || '').trim().toLowerCase();
    const contrasena = req.body.password || req.body.contrasena;

    if (!correo || !contrasena) {
      return res.status(400).json({
        error: 'Debe ingresar correo institucional y contraseña.'
      });
    }

    let usuario = null;

    if (isPostgresConnected()) {
      const sql = 'SELECT * FROM usuarios WHERE LOWER(correo) = $1 OR LOWER(usuario) = $1 LIMIT 1';
      const result = await query(sql, [correo]);
      if (result && result.rows && result.rows.length > 0) {
        usuario = result.rows[0];
      }
    }

    // Fallback a base en memoria
    if (!usuario) {
      usuario = memoriaDB.usuarios.find(u => 
        u.correo.toLowerCase() === correo || u.usuario.toLowerCase() === correo
      );
    }

    if (!usuario) {
      return res.status(401).json({
        error: 'Credenciales inválidas. Usuario no registrado.'
      });
    }

    // Validación de contraseña (plana o bcrypt)
    const passwordCoincide = (usuario.contrasena === contrasena);
    if (!passwordCoincide) {
      return res.status(401).json({
        error: 'Contraseña incorrecta.'
      });
    }

    // Firma del token JWT (expira en 12 horas)
    const token = jwt.sign(
      {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        area: usuario.area
      },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.status(200).json({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        usuario: usuario.usuario,
        rol: usuario.rol,
        area: usuario.area,
        turno: usuario.turno
      }
    });

  } catch (error) {
    console.error('[AuthController Error]', error);
    return res.status(500).json({
      error: 'Error interno en el servidor de autenticación.'
    });
  }
};

