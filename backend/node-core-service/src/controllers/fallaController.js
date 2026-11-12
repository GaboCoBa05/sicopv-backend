const { query, memoriaDB, isPostgresConnected } = require('../config/db');

// POST /api/fallas
exports.crearFalla = async (req, res) => {
  try {
    const {
      equipo_id,
      tipo_falla,
      descripcion,
      descripcion_adicional,
      prioridad,
      usuario_reporta_id
    } = req.body;

    if (!equipo_id || !tipo_falla || !descripcion || !prioridad) {
      return res.status(400).json({
        error: 'Los campos equipo_id, tipo_falla, descripcion y prioridad son obligatorios.'
      });
    }

    const prioridadNorm = prioridad.toUpperCase();
    const prioridadesValidas = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];
    const pFinal = prioridadesValidas.includes(prioridadNorm) ? prioridadNorm : 'MEDIA';

    // Generación de Folio único FOL-XXXXXX
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const folio = `FOL-${randomSuffix}`;

    let nuevaFalla = null;

    if (isPostgresConnected()) {
      // 1. Insertar falla
      const sqlFalla = `
        INSERT INTO fallas (folio, equipo_id, usuario_reporta_id, tipo_falla, descripcion, descripcion_adicional, prioridad, estado)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'ABIERTA')
        RETURNING *
      `;
      const resFalla = await query(sqlFalla, [
        folio,
        parseInt(equipo_id, 10),
        usuario_reporta_id ? parseInt(usuario_reporta_id, 10) : null,
        tipo_falla,
        descripcion,
        descripcion_adicional || null,
        pFinal
      ]);

      if (resFalla && resFalla.rows.length > 0) {
        nuevaFalla = resFalla.rows[0];
      }

      // 2. Cambiar estado del equipo a 'EN_PARO'
      await query("UPDATE equipos SET estado = 'EN_PARO' WHERE id = $1", [parseInt(equipo_id, 10)]);
    }

    if (!nuevaFalla) {
      nuevaFalla = {
        id: memoriaDB.fallas.length + 1,
        folio,
        equipo_id: parseInt(equipo_id, 10),
        usuario_reporta_id: usuario_reporta_id || null,
        tipo_falla,
        descripcion,
        descripcion_adicional: descripcion_adicional || '',
        prioridad: pFinal,
        estado: 'ABIERTA',
        fecha_reporte: new Date().toISOString()
      };
      memoriaDB.fallas.unshift(nuevaFalla);

      const eq = memoriaDB.equipos.find(e => e.id === parseInt(equipo_id, 10));
      if (eq) {
        eq.estado = 'EN_PARO';
      }
    }

    console.log(`[fallaController] Falla reportada: Folio ${folio} -> Equipo ${equipo_id} (Estado: EN_PARO)`);

    return res.status(201).json({
      message: 'Falla registrada exitosamente. Equipo marcado en paro.',
      folio: nuevaFalla.folio,
      falla: nuevaFalla
    });

  } catch (error) {
    console.error('[fallaController.crearFalla Error]', error);
    return res.status(500).json({ error: 'Error interno al registrar el reporte de falla.' });
  }
};

// GET /api/fallas
exports.listarFallas = async (req, res) => {
  try {
    if (isPostgresConnected()) {
      const sql = `
        SELECT f.*, e.nombre AS equipo_nombre, e.numero_serie, e.ubicacion_area, u.nombre_usuario AS reportado_por
        FROM fallas f
        LEFT JOIN equipos e ON f.equipo_id = e.id
        LEFT JOIN usuarios u ON f.usuario_reporta_id = u.id
        ORDER BY f.fecha_reporte DESC
      `;
      const result = await query(sql);
      if (result && result.rows) {
        return res.status(200).json(result.rows);
      }
    }

    // Memoria fallback con joins simulados
    const listado = memoriaDB.fallas.map(f => {
      const eq = memoriaDB.equipos.find(e => e.id === f.equipo_id) || {};
      const us = memoriaDB.usuarios.find(u => u.id === f.usuario_reporta_id) || {};
      return {
        ...f,
        equipo_nombre: eq.nombre || `Equipo #${f.equipo_id}`,
        numero_serie: eq.numero_serie || 'N/A',
        ubicacion_area: eq.ubicacion_area || 'Planta',
        reportado_por: us.nombre_usuario || 'Operador'
      };
    });

    return res.status(200).json(listado);

  } catch (error) {
    console.error('[fallaController.listarFallas Error]', error);
    return res.status(500).json({ error: 'Error al consultar las fallas.' });
  }
};
