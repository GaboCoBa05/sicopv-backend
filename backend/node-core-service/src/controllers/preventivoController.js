const { query, memoriaDB, isPostgresConnected } = require('../config/db');

// POST /api/preventivos
exports.programarPreventivo = async (req, res) => {
  try {
    const {
      equipo_id,
      tecnico_id,
      periodo_uso,
      piezas_cambiar,
      descripcion_tarea,
      fecha_programada
    } = req.body;

    if (!equipo_id || !periodo_uso || !piezas_cambiar || !descripcion_tarea) {
      return res.status(400).json({
        error: 'Debe especificar el equipo, período de uso, piezas a cambiar y descripción de la tarea.'
      });
    }

    const fechaProg = fecha_programada || new Date().toISOString().split('T')[0];

    if (isPostgresConnected()) {
      // Validar duplicado para el mismo equipo, período y fecha
      const dup = await query(
        `SELECT id FROM mantenimiento_preventivo 
         WHERE equipo_id = $1 AND periodo_uso = $2 AND fecha_programada = $3 AND estado = 'PROGRAMADO'`,
        [parseInt(equipo_id, 10), periodo_uso.trim(), fechaProg]
      );

      if (dup && dup.rows.length > 0) {
        return res.status(409).json({
          error: 'Registro duplicado: Ya existe un mantenimiento preventivo programado para este equipo y período.'
        });
      }

      const sql = `
        INSERT INTO mantenimiento_preventivo (equipo_id, tecnico_id, periodo_uso, piezas_cambiar, descripcion_tarea, fecha_programada, estado)
        VALUES ($1, $2, $3, $4, $5, $6, 'PROGRAMADO')
        RETURNING *
      `;
      const result = await query(sql, [
        parseInt(equipo_id, 10),
        tecnico_id ? parseInt(tecnico_id, 10) : null,
        periodo_uso.trim(),
        piezas_cambiar.trim(),
        descripcion_tarea.trim(),
        fechaProg
      ]);

      return res.status(201).json({
        message: 'Mantenimiento preventivo programado exitosamente',
        mantenimiento: result.rows[0]
      });
    }

    // Memoria fallback
    const dupMem = memoriaDB.mantenimiento_preventivo.some(m =>
      m.equipo_id === parseInt(equipo_id, 10) &&
      m.periodo_uso.toLowerCase() === periodo_uso.trim().toLowerCase() &&
      m.estado === 'PROGRAMADO'
    );

    if (dupMem) {
      return res.status(409).json({
        error: 'Registro duplicado: Ya existe un mantenimiento preventivo programado para este equipo y período.'
      });
    }

    const nuevo = {
      id: memoriaDB.mantenimiento_preventivo.length + 1,
      equipo_id: parseInt(equipo_id, 10),
      tecnico_id: tecnico_id || 1,
      periodo_uso: periodo_uso.trim(),
      piezas_cambiar: piezas_cambiar.trim(),
      descripcion_tarea: descripcion_tarea.trim(),
      fecha_programada: fechaProg,
      estado: 'PROGRAMADO'
    };
    memoriaDB.mantenimiento_preventivo.push(nuevo);

    return res.status(201).json({
      message: 'Mantenimiento preventivo programado exitosamente',
      mantenimiento: nuevo
    });

  } catch (error) {
    console.error('[preventivoController.programarPreventivo Error]', error);
    return res.status(500).json({ error: 'Error al programar el mantenimiento preventivo.' });
  }
};

// GET /api/preventivos
exports.listarPreventivos = async (req, res) => {
  try {
    if (isPostgresConnected()) {
      const sql = `
        SELECT mp.*, e.nombre AS equipo_nombre, e.numero_serie, e.ubicacion_area, u.nombre_usuario AS tecnico_nombre
        FROM mantenimiento_preventivo mp
        JOIN equipos e ON mp.equipo_id = e.id
        LEFT JOIN tecnicos t ON mp.tecnico_id = t.id
        LEFT JOIN usuarios u ON t.usuario_id = u.id
        ORDER BY mp.fecha_programada ASC
      `;
      const result = await query(sql);
      if (result && result.rows) {
        return res.status(200).json(result.rows);
      }
    }

    const listado = memoriaDB.mantenimiento_preventivo.map(mp => {
      const eq = memoriaDB.equipos.find(e => e.id === mp.equipo_id) || {};
      const tec = memoriaDB.tecnicos.find(t => t.id === mp.tecnico_id) || {};
      return {
        ...mp,
        equipo_nombre: eq.nombre || `Máquina #${mp.equipo_id}`,
        numero_serie: eq.numero_serie || 'N/A',
        ubicacion_area: eq.ubicacion_area || 'Línea de producción',
        tecnico_nombre: tec.nombre || 'Técnico Asignado'
      };
    });

    return res.status(200).json(listado);

  } catch (error) {
    console.error('[preventivoController.listarPreventivos Error]', error);
    return res.status(500).json({ error: 'Error al consultar mantenimientos preventivos.' });
  }
};

// PUT /api/preventivos/:id  (SOLO ADMIN)
exports.actualizarPreventivo = async (req, res) => {
  try {
    const { id } = req.params;
    const { periodo_uso, piezas_cambiar, descripcion_tarea, fecha_programada, estado } = req.body;

    if (isPostgresConnected()) {
      const result = await query(
        `UPDATE mantenimiento_preventivo
         SET periodo_uso = COALESCE($1, periodo_uso),
             piezas_cambiar = COALESCE($2, piezas_cambiar),
             descripcion_tarea = COALESCE($3, descripcion_tarea),
             fecha_programada = COALESCE($4, fecha_programada),
             estado = COALESCE($5, estado)
         WHERE id = $6 RETURNING id`,
        [periodo_uso || null, piezas_cambiar || null, descripcion_tarea || null,
         fecha_programada || null, estado || null, id]
      );
      if (result && result.rows.length === 0) {
        return res.status(404).json({ error: 'Preventivo no encontrado.' });
      }
    } else {
      const m = memoriaDB.mantenimiento_preventivo.find(item => item.id === Number(id));
      if (!m) return res.status(404).json({ error: 'Preventivo no encontrado.' });
      Object.assign(m, { periodo_uso, piezas_cambiar, descripcion_tarea, fecha_programada, estado });
    }

    return res.status(200).json({ message: 'Preventivo actualizado correctamente.' });
  } catch (error) {
    console.error('[preventivoController.actualizarPreventivo Error]', error);
    return res.status(500).json({ error: 'Error al actualizar el preventivo.' });
  }
};

// DELETE /api/preventivos/:id  (SOLO ADMIN)
exports.eliminarPreventivo = async (req, res) => {
  try {
    const { id } = req.params;

    if (isPostgresConnected()) {
      const result = await query('DELETE FROM mantenimiento_preventivo WHERE id = $1 RETURNING id', [id]);
      if (result && result.rows.length === 0) {
        return res.status(404).json({ error: 'Preventivo no encontrado.' });
      }
    } else {
      memoriaDB.mantenimiento_preventivo = memoriaDB.mantenimiento_preventivo.filter(item => item.id !== Number(id));
    }

    return res.status(200).json({ message: 'Preventivo eliminado correctamente.' });
  } catch (error) {
    console.error('[preventivoController.eliminarPreventivo Error]', error);
    return res.status(500).json({ error: 'Error al eliminar el preventivo.' });
  }
};

