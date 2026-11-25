const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { enviarCodigoVerificacion } = require('../utils/mailer');

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_vibecode_sicopv_2026';

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const rawInput = String(req.body.email || req.body.correo || req.body.usuario || req.body.nombre_usuario || '').trim().toLowerCase();
    const password = String(req.body.password || req.body.contrasena || '');

    if (!rawInput || !password) {
      return res.status(400).json({ error: 'Debe ingresar usuario/correo y contraseña.' });
    }

    // Permite escribir 'supervisor tsr' o 'supervisorsr' para el usuario 'supervisor_tsr'
    const credencialGuion = rawInput.replace(/\s+/g, '_');
    const credencialSinEspacio = rawInput.replace(/\s+/g, '');

    const sql = `
      SELECT * FROM usuarios
      WHERE LOWER(correo) = $1
         OR LOWER(nombre_usuario) = $1
         OR LOWER(nombre_usuario) = $2
         OR LOWER(nombre_usuario) = $3
      LIMIT 1
    `;
    const result = await query(sql, [rawInput, credencialGuion, credencialSinEspacio]);

    if (!result || result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas. Usuario no registrado.' });
    }

    const usuario = result.rows[0];

    if (!usuario.password_hash) {
      return res.status(401).json({ error: 'Contraseña incorrecta.' });
    }

    const passwordValido = bcrypt.compareSync(password, usuario.password_hash);
    if (!passwordValido) {
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

// POST /api/auth/register (Acceso restringido: Solo Administrador autenticado)
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

    const passwordHash = bcrypt.hashSync(password, 10);

    const existe = await query(
      'SELECT id FROM usuarios WHERE LOWER(nombre_usuario) = $1 OR LOWER(correo) = $2',
      [nombre_usuario.toLowerCase(), correo.toLowerCase()]
    );
    if (existe && existe.rows.length > 0) {
      return res.status(409).json({ error: 'El nombre de usuario o correo ya se encuentra registrado.' });
    }

    const sql = `
      INSERT INTO usuarios (nombre_usuario, correo, password_hash, telefono, rol)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nombre_usuario, correo, telefono, rol, created_at
    `;
    const result = await query(sql, [nombre_usuario.trim(), correo.trim().toLowerCase(), passwordHash, telefono || null, rolAsignado]);

    return res.status(201).json({
      message: 'Usuario aprovisionado exitosamente por Administrador',
      usuario: result.rows[0]
    });

  } catch (error) {
    console.error('[authController.register Error]', error);
    return res.status(500).json({ error: 'Error al registrar usuario.' });
  }
};

// POST /api/auth/solicitar-codigo
// Valida que el correo esté registrado en la BD y despacha el código de verificación.
exports.solicitarCodigo = async (req, res) => {
  try {
    const rawCorreo = (req.body.correo || req.body.email || '').trim().toLowerCase();

    if (!rawCorreo) {
      return res.status(400).json({ error: 'Debe ingresar su correo electrónico registrado.' });
    }

    const result = await query(
      'SELECT id, nombre_usuario, correo, rol FROM usuarios WHERE LOWER(correo) = $1 LIMIT 1',
      [rawCorreo]
    );

    if (!result || result.rows.length === 0) {
      return res.status(404).json({
        error: 'El correo electrónico no se encuentra registrado en el sistema de planta. Solo cuentas autorizadas pueden solicitar códigos.'
      });
    }

    const usuario = result.rows[0];
    const codigo = String(Math.floor(100000 + Math.random() * 900000));

    await query('UPDATE usuarios SET codigo_reset = $1 WHERE id = $2', [codigo, usuario.id]);

    const despacho = await enviarCodigoVerificacion({
      to: usuario.correo,
      codigo,
      usuario: usuario.nombre_usuario
    });

    const message = despacho.enviado
      ? `Código de verificación de 6 dígitos enviado exitosamente a ${usuario.correo}.`
      : `Código generado, pero no se pudo enviar porque no hay proveedor de correo configurado. Contacta al Administrador de planta.`;

    return res.status(200).json({
      message,
      correo: usuario.correo,
      enviado: despacho.enviado,
      expiracion_minutos: 15
    });

  } catch (error) {
    console.error('[authController.solicitarCodigo Error]', error);
    return res.status(500).json({ error: 'Error al procesar la solicitud del código de verificación.' });
  }
};

// PUT /api/auth/reset-password
// Valida el código de verificación contra la BD antes de actualizar la clave.
exports.resetPassword = async (req, res) => {
  try {
    const { correo, codigo_verificacion, codigo, nueva_contrasena, contrasena_nueva } = req.body;
    const passwordFinal = nueva_contrasena || contrasena_nueva;
    const codigoIngresado = (codigo_verificacion || codigo || '').trim();

    const emailAfectado = (correo || (req.usuario && req.usuario.correo) || '').trim().toLowerCase();

    if (!emailAfectado || !passwordFinal) {
      return res.status(400).json({ error: 'Debe ingresar el correo y la nueva contraseña.' });
    }

    if (passwordFinal.length < 8) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener un mínimo de 8 caracteres.' });
    }

    const resUser = await query('SELECT * FROM usuarios WHERE LOWER(correo) = $1 LIMIT 1', [emailAfectado]);
    if (!resUser || resUser.rows.length === 0) {
      return res.status(404).json({ error: 'No existe una cuenta asociada a este correo electrónico.' });
    }

    const usuario = resUser.rows[0];

    const estaAutenticadoSesion = req.usuario && (String(req.usuario.correo).toLowerCase() === emailAfectado);
    if (!estaAutenticadoSesion) {
      if (!codigoIngresado) {
        return res.status(400).json({ error: 'Debe ingresar el código de verificación de 6 dígitos enviado a su correo.' });
      }

      const codigoAlmacenado = String(usuario.codigo_reset || '').trim();
      if (!codigoAlmacenado || codigoAlmacenado !== codigoIngresado) {
        return res.status(400).json({
          error: 'Código de verificación incorrecto o expirado. Solicita un código nuevo a tu correo.'
        });
      }
    }

    const passwordHash = bcrypt.hashSync(passwordFinal, 10);
    await query('UPDATE usuarios SET password_hash = $1, codigo_reset = NULL WHERE id = $2', [passwordHash, usuario.id]);

    return res.status(200).json({
      message: '¡Identidad verificada y contraseña actualizada exitosamente! Inicie sesión con su nueva clave personal.'
    });

  } catch (error) {
    console.error('[authController.resetPassword Error]', error);
    return res.status(500).json({ error: 'Error al restablecer la contraseña.' });
  }
};

// GET /api/usuarios (SOLO ADMIN)
exports.listarUsuarios = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, nombre_usuario, correo, telefono, rol, created_at FROM usuarios ORDER BY id ASC'
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('[authController.listarUsuarios Error]', error);
    return res.status(500).json({ error: 'Error al consultar usuarios.' });
  }
};

// PUT /api/usuarios/:id (SOLO ADMIN)
exports.actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_usuario, correo, telefono, rol, password } = req.body;

    const rolesValidos = ['ADMIN', 'JEFE_MANTTO', 'TECNICO', 'OPERADOR', 'SUPERVISOR', 'CALIDAD'];
    if (rol && !rolesValidos.includes(String(rol).toUpperCase())) {
      return res.status(400).json({ error: `Rol no válido. Permitidos: ${rolesValidos.join(', ')}` });
    }

    const nuevoHash = password ? bcrypt.hashSync(password, 10) : null;

    let result;
    if (nuevoHash) {
      result = await query(
        `UPDATE usuarios
         SET nombre_usuario = COALESCE($1, nombre_usuario),
             correo = COALESCE($2, correo),
             telefono = COALESCE($3, telefono),
             rol = COALESCE($4, rol),
             password_hash = $5
         WHERE id = $6 RETURNING id, nombre_usuario, correo, telefono, rol`,
        [nombre_usuario || null, correo || null, telefono || null, rol ? String(rol).toUpperCase() : null, nuevoHash, id]
      );
    } else {
      result = await query(
        `UPDATE usuarios
         SET nombre_usuario = COALESCE($1, nombre_usuario),
             correo = COALESCE($2, correo),
             telefono = COALESCE($3, telefono),
             rol = COALESCE($4, rol)
         WHERE id = $5 RETURNING id, nombre_usuario, correo, telefono, rol`,
        [nombre_usuario || null, correo || null, telefono || null, rol ? String(rol).toUpperCase() : null, id]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    return res.status(200).json({ message: 'Usuario actualizado correctamente.' });
  } catch (error) {
    console.error('[authController.actualizarUsuario Error]', error);
    return res.status(500).json({ error: 'Error al actualizar el usuario.' });
  }
};

// DELETE /api/usuarios/:id (SOLO ADMIN)
exports.eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM usuarios WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    return res.status(200).json({ message: 'Usuario eliminado correctamente.' });
  } catch (error) {
    console.error('[authController.eliminarUsuario Error]', error);
    return res.status(500).json({ error: 'Error al eliminar el usuario.' });
  }
};
