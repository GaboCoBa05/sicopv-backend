const { query, memoriaDB, isPostgresConnected } = require('../config/db');

// POST /api/tecnicos
exports.registrarTecnico = async (req, res) => {
  try {
    const { usuario, nombre, correo, password, area, especialidad } = req.body;
    const username = (usuario || nombre || '').trim();

    if (!username || !correo || !password || !area || !especialidad) {
      return res.status(400).json({
        error: 'Verificar información previa - Error en registro: Todos los campos son obligatorios.'
      });
    }

    const areaNorm = area.trim();
    const areasValidas = ['Mantenimiento', 'Eléctrica', 'Mecánica', 'Robótica', 'Producción'];
    if (!areasValidas.includes(areaNorm)) {
      return res.status(400).json({
        error: `Verificar información previa - Error en registro: Área no válida. Permitidas: ${areasValidas.join(', ')}`
      });
    }

    if (isPostgresConnected()) {
      // Validar duplicados de usuario o correo
      const dup = await query(
        'SELECT id FROM usuarios WHERE LOWER(nombre_usuario) = $1 OR LOWER(correo) = $2',
        [username.toLowerCase(), correo.trim().toLowerCase()]
      );

      if (dup && dup.rows.length > 0) {
        return res.status(409).json({
          error: 'Verificar información previa - Error en registro: El usuario o correo ya existe.'
        });
      }

      // 1. Insertar usuario con rol TECNICO
      const sqlU = `
        INSERT INTO usuarios (nombre_usuario, correo, password_hash, rol)
        VALUES ($1, $2, $3, 'TECNICO')
        RETURNING id, nombre_usuario, correo, rol
      `;
      const resU = await query(sqlU, [username, correo.trim().toLowerCase(), password]);
      const nuevoUsuario = resU.rows[0];

      // 2. Insertar en tabla tecnicos
      const sqlT = `
        INSERT INTO tecnicos (usuario_id, area, especialidad)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const resT = await query(sqlT, [nuevoUsuario.id, areaNorm, especialidad.trim()]);
      const nuevoTec = resT.rows[0];

      return res.status(201).json({
        message: 'Técnico registrado exitosamente',
        tecnico: {
          id: nuevoTec.id,
          usuario_id: nuevoUsuario.id,
          nombre_usuario: nuevoUsuario.nombre_usuario,
          correo: nuevoUsuario.correo,
          area: nuevoTec.area,
          especialidad: nuevoTec.especialidad
        }
      });
    }

    // Memoria fallback
    const yaExiste = memoriaDB.usuarios.some(u =>
      u.nombre_usuario.toLowerCase() === username.toLowerCase() ||
      u.correo.toLowerCase() === correo.trim().toLowerCase()
    );

    if (yaExiste) {
      return res.status(409).json({
        error: 'Verificar información previa - Error en registro: El usuario o correo ya existe.'
      });
    }

    const nuevoU = {
      id: memoriaDB.usuarios.length + 1,
      nombre_usuario: username,
      correo: correo.trim().toLowerCase(),
      password_hash: password,
      telefono: null,
      rol: 'TECNICO'
    };
    memoriaDB.usuarios.push(nuevoU);

    const nuevoT = {
      id: memoriaDB.tecnicos.length + 1,
      usuario_id: nuevoU.id,
      area: areaNorm,
      especialidad: especialidad.trim(),
      nombre: username,
      correo: nuevoU.correo
    };
    memoriaDB.tecnicos.push(nuevoT);

    return res.status(201).json({
      message: 'Técnico registrado exitosamente',
      tecnico: nuevoT
    });

  } catch (error) {
    console.error('[tecnicoController.registrarTecnico Error]', error);
    return res.status(500).json({ error: 'Error al registrar al técnico.' });
  }
};

// GET /api/tecnicos
exports.listarTecnicos = async (req, res) => {
  try {
    if (isPostgresConnected()) {
      const sql = `
        SELECT t.id, t.usuario_id, t.area, t.especialidad, u.nombre_usuario, u.correo, u.telefono
        FROM tecnicos t
        JOIN usuarios u ON t.usuario_id = u.id
        ORDER BY t.area ASC, u.nombre_usuario ASC
      `;
      const result = await query(sql);
      if (result && result.rows) {
        return res.status(200).json(result.rows);
      }
    }

    const listado = memoriaDB.tecnicos.map(t => {
      const u = memoriaDB.usuarios.find(item => item.id === t.usuario_id) || {};
      return {
        id: t.id,
        usuario_id: t.usuario_id,
        area: t.area,
        especialidad: t.especialidad,
        nombre_usuario: u.nombre_usuario || t.nombre || 'Técnico',
        correo: u.correo || t.correo || '',
        telefono: u.telefono || ''
      };
    });

    return res.status(200).json(listado);

  } catch (error) {
    console.error('[tecnicoController.listarTecnicos Error]', error);
    return res.status(500).json({ error: 'Error al consultar lista de técnicos.' });
  }
};

// PUT /api/tecnicos/:id  (SOLO ADMIN)
exports.actualizarTecnico = async (req, res) => {
  try {
    const { id } = req.params;
    const { area, especialidad, nombre_usuario, correo } = req.body;

    if (isPostgresConnected()) {
      const tec = await query('SELECT usuario_id FROM tecnicos WHERE id = $1', [id]);
      if (!tec || tec.rows.length === 0) {
        return res.status(404).json({ error: 'Técnico no encontrado.' });
      }
      await query(
        'UPDATE tecnicos SET area = COALESCE($1, area), especialidad = COALESCE($2, especialidad) WHERE id = $3',
        [area || null, especialidad || null, id]
      );
      await query(
        'UPDATE usuarios SET nombre_usuario = COALESCE($1, nombre_usuario), correo = COALESCE($2, correo) WHERE id = $3',
        [nombre_usuario || null, correo || null, tec.rows[0].usuario_id]
      );
    } else {
      const t = memoriaDB.tecnicos.find(item => item.id === Number(id));
      if (!t) return res.status(404).json({ error: 'Técnico no encontrado.' });
      Object.assign(t, { area, especialidad });
      const u = memoriaDB.usuarios.find(item => item.id === t.usuario_id);
      if (u) Object.assign(u, { nombre_usuario, correo });
    }

    return res.status(200).json({ message: 'Técnico actualizado correctamente.' });
  } catch (error) {
    console.error('[tecnicoController.actualizarTecnico Error]', error);
    return res.status(500).json({ error: 'Error al actualizar el técnico.' });
  }
};

// DELETE /api/tecnicos/:id  (SOLO ADMIN)
exports.eliminarTecnico = async (req, res) => {
  try {
    const { id } = req.params;

    if (isPostgresConnected()) {
      const tec = await query('SELECT usuario_id FROM tecnicos WHERE id = $1', [id]);
      if (!tec || tec.rows.length === 0) {
        return res.status(404).json({ error: 'Técnico no encontrado.' });
      }
      // El esquema tiene ON DELETE CASCADE de usuarios -> tecnicos
      await query('DELETE FROM usuarios WHERE id = $1', [tec.rows[0].usuario_id]);
    } else {
      const t = memoriaDB.tecnicos.find(item => item.id === Number(id));
      if (!t) return res.status(404).json({ error: 'Técnico no encontrado.' });
      memoriaDB.usuarios = memoriaDB.usuarios.filter(u => u.id !== t.usuario_id);
      memoriaDB.tecnicos = memoriaDB.tecnicos.filter(item => item.id !== Number(id));
    }

    return res.status(200).json({ message: 'Técnico eliminado correctamente.' });
  } catch (error) {
    console.error('[tecnicoController.eliminarTecnico Error]', error);
    return res.status(500).json({ error: 'Error al eliminar el técnico.' });
  }
};

