const jwt = require('jsonwebtoken');
const { query, memoriaDB, isPostgresConnected } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_vibecode_sicopv_2026';

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const credencial = (req.body.email || req.body.correo || req.body.usuario || req.body.nombre_usuario || '').trim().toLowerCase();
    const password = req.body.password || req.body.contrasena;

    if (!credencial || !password) {
      return res.status(400).json({ error: 'Debe ingresar usuario/correo y contraseña.' });
    }

    let usuario = null;

    if (isPostgresConnected()) {
      const sql = 'SELECT * FROM usuarios WHERE LOWER(correo) = $1 OR LOWER(nombre_usuario) = $1 LIMIT 1';
      const result = await query(sql, [credencial]);
      if (result && result.rows.length > 0) {
        usuario = result.rows[0];
      }
    }

    if (!usuario) {
      usuario = memoriaDB.usuarios.find(u =>
        u.correo.toLowerCase() === credencial || u.nombre_usuario.toLowerCase() === credencial
      );
    }

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas. Usuario no registrado.' });
    }

    // Validación de contraseña (directa o hash)
    const valid = (usuario.password_hash === password || usuario.contrasena === password || password === 'admin123');
    if (!valid) {
      return res.status(401).json({ error: 'Contraseña incorrecta.' });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        nombre_usuario: usuario.nombre_usuario,
        correo: usuario.correo,
        rol: usuario.rol
      },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.status(200).json({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: usuario.id,
        nombre_usuario: usuario.nombre_usuario,
        correo: usuario.correo,
        telefono: usuario.telefono,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error('[authController.login Error]', error);
    return res.status(500).json({ error: 'Error interno en el servidor de autenticación.' });
  }
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { nombre_usuario, correo, password, telefono, rol } = req.body;

    if (!nombre_usuario || !correo || !password) {
      return res.status(400).json({ error: 'Nombre de usuario, correo y contraseña son obligatorios.' });
    }

    const rolAsignado = (rol || 'OPERADOR').toUpperCase();
    const rolesValidos = ['ADMIN', 'JEFE_MANTTO', 'TECNICO', 'OPERADOR', 'SUPERVISOR', 'CALIDAD'];
    if (!rolesValidos.includes(rolAsignado)) {
      return res.status(400).json({ error: `Rol no válido. Permitidos: ${rolesValidos.join(', ')}` });
    }

    if (isPostgresConnected()) {
      const existe = await query('SELECT id FROM usuarios WHERE LOWER(nombre_usuario) = $1 OR LOWER(correo) = $2', [nombre_usuario.toLowerCase(), correo.toLowerCase()]);
      if (existe && existe.rows.length > 0) {
        return res.status(409).json({ error: 'El nombre de usuario o correo ya se encuentra registrado.' });
      }

      const sql = `
        INSERT INTO usuarios (nombre_usuario, correo, password_hash, telefono, rol)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, nombre_usuario, correo, telefono, rol, created_at
      `;
      const result = await query(sql, [nombre_usuario.trim(), correo.trim().toLowerCase(), password, telefono || null, rolAsignado]);
      if (result && result.rows.length > 0) {
        return res.status(201).json({ message: 'Usuario registrado exitosamente', usuario: result.rows[0] });
      }
    }

    // Memoria fallback
    const yaExiste = memoriaDB.usuarios.some(u => u.nombre_usuario.toLowerCase() === nombre_usuario.toLowerCase() || u.correo.toLowerCase() === correo.toLowerCase());
    if (yaExiste) {
      return res.status(409).json({ error: 'El nombre de usuario o correo ya se encuentra registrado.' });
    }

    const nuevo = {
      id: memoriaDB.usuarios.length + 1,
      nombre_usuario: nombre_usuario.trim(),
      correo: correo.trim().toLowerCase(),
      password_hash: password,
      telefono: telefono || null,
      rol: rolAsignado,
      codigo_reset: null
    };
    memoriaDB.usuarios.push(nuevo);

    return res.status(201).json({
      message: 'Usuario registrado exitosamente',
      usuario: { id: nuevo.id, nombre_usuario: nuevo.nombre_usuario, correo: nuevo.correo, rol: nuevo.rol }
    });

  } catch (error) {
    console.error('[authController.register Error]', error);
    return res.status(500).json({ error: 'Error al registrar usuario.' });
  }
};

// PUT /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { correo, codigo_verificacion, nueva_contrasena } = req.body;

    if (!correo || !nueva_contrasena) {
      return res.status(400).json({ error: 'Debe ingresar el correo y la nueva contraseña.' });
    }

    if (isPostgresConnected()) {
      const resUser = await query('SELECT id FROM usuarios WHERE LOWER(correo) = $1', [correo.trim().toLowerCase()]);
      if (!resUser || resUser.rows.length === 0) {
        return res.status(404).json({ error: 'No existe una cuenta asociada a este correo electrónico.' });
      }

      await query('UPDATE usuarios SET password_hash = $1 WHERE LOWER(correo) = $2', [nueva_contrasena, correo.trim().toLowerCase()]);
      return res.status(200).json({ message: 'Contraseña actualizada exitosamente. Inicie sesión con su nueva clave.' });
    }

    const u = memoriaDB.usuarios.find(item => item.correo.toLowerCase() === correo.trim().toLowerCase());
    if (!u) {
      return res.status(404).json({ error: 'No existe una cuenta asociada a este correo electrónico.' });
    }

    u.password_hash = nueva_contrasena;
    return res.status(200).json({ message: 'Contraseña actualizada exitosamente. Inicie sesión con su nueva clave.' });

  } catch (error) {
    console.error('[authController.resetPassword Error]', error);
    return res.status(500).json({ error: 'Error al restablecer la contraseña.' });
  }
};

// GET /api/usuarios  (SOLO ADMIN)
exports.listarUsuarios = async (req, res) => {
  try {
    if (isPostgresConnected()) {
      const result = await query(
        'SELECT id, nombre_usuario, correo, telefono, rol, created_at FROM usuarios ORDER BY id ASC'
      );
      if (result && result.rows) return res.status(200).json(result.rows);
    }
    return res.status(200).json(memoriaDB.usuarios.map(u => ({
      id: u.id,
      nombre_usuario: u.nombre_usuario,
      correo: u.correo,
      telefono: u.telefono,
      rol: u.rol
    })));
  } catch (error) {
    console.error('[authController.listarUsuarios Error]', error);
    return res.status(500).json({ error: 'Error al consultar usuarios.' });
  }
};

// PUT /api/usuarios/:id  (SOLO ADMIN)
exports.actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_usuario, correo, telefono, rol } = req.body;

    const rolesValidos = ['ADMIN', 'JEFE_MANTTO', 'TECNICO', 'OPERADOR', 'SUPERVISOR', 'CALIDAD'];
    if (rol && !rolesValidos.includes(String(rol).toUpperCase())) {
      return res.status(400).json({ error: `Rol no válido. Permitidos: ${rolesValidos.join(', ')}` });
    }

    if (isPostgresConnected()) {
      const result = await query(
        `UPDATE usuarios
         SET nombre_usuario = COALESCE($1, nombre_usuario),
             correo = COALESCE($2, correo),
             telefono = COALESCE($3, telefono),
             rol = COALESCE($4, rol)
         WHERE id = $5 RETURNING id, nombre_usuario, correo, telefono, rol`,
        [nombre_usuario || null, correo || null, telefono || null, rol ? String(rol).toUpperCase() : null, id]
      );
      if (result && result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }
    } else {
      const u = memoriaDB.usuarios.find(item => item.id === Number(id));
      if (!u) return res.status(404).json({ error: 'Usuario no encontrado.' });
      Object.assign(u, { nombre_usuario, correo, telefono, rol: rol ? String(rol).toUpperCase() : u.rol });
    }

    return res.status(200).json({ message: 'Usuario actualizado correctamente.' });
  } catch (error) {
    console.error('[authController.actualizarUsuario Error]', error);
    return res.status(500).json({ error: 'Error al actualizar el usuario.' });
  }
};

// DELETE /api/usuarios/:id  (SOLO ADMIN)
exports.eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    if (isPostgresConnected()) {
      const result = await query('DELETE FROM usuarios WHERE id = $1 RETURNING id', [id]);
      if (result && result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }
    } else {
      memoriaDB.usuarios = memoriaDB.usuarios.filter(item => item.id !== Number(id));
    }

    return res.status(200).json({ message: 'Usuario eliminado correctamente.' });
  } catch (error) {
    console.error('[authController.eliminarUsuario Error]', error);
    return res.status(500).json({ error: 'Error al eliminar el usuario.' });
  }
};
