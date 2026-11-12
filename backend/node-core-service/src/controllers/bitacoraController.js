const { query, memoriaDB, isPostgresConnected } = require('../config/db');

// POST /api/bitacora
exports.registrarBitacora = async (req, res) => {
  try {
    const {
      falla_id,
      tecnico_id,
      tiempo_reparacion_min,
      causa_raiz,
      refacciones_empleadas
    } = req.body;

    // Regla de validación: RELLENAR TODOS LOS CAMPOS
    if (!falla_id || !causa_raiz || !refacciones_empleadas) {
      return res.status(400).json({
        error: 'RELLENAR TODOS LOS CAMPOS: Falla, Causa raíz y Refacciones empleadas son obligatorios.'
      });
    }

    const tiempoMin = parseInt(tiempo_reparacion_min || 0, 10);
    if (isNaN(tiempoMin) || tiempoMin < 0) {
      return res.status(400).json({
        error: 'El tiempo de reparación debe ser un valor numérico válido (en minutos).'
      });
    }

    let registro = null;

    if (isPostgresConnected()) {
      // 1. Obtener la falla para identificar el equipo
      const resF = await query('SELECT id, equipo_id, folio FROM fallas WHERE id = $1', [parseInt(falla_id, 10)]);
      if (!resF || resF.rows.length === 0) {
        return res.status(404).json({ error: 'La falla especificada no existe.' });
      }
      const falla = resF.rows[0];

      // 2. Insertar en reparacion_bitacora
      const sqlBit = `
        INSERT INTO reparacion_bitacora (falla_id, tecnico_id, fecha_inicio, fecha_fin, tiempo_reparacion_min, causa_raiz, refacciones_empleadas)
        VALUES ($1, $2, NOW() - ($3 || ' minutes')::INTERVAL, NOW(), $3, $4, $5)
        RETURNING *
      `;
      const resBit = await query(sqlBit, [
        falla.id,
        tecnico_id ? parseInt(tecnico_id, 10) : null,
        tiempoMin,
        causa_raiz.trim(),
        refacciones_empleadas.trim()
      ]);

      if (resBit && resBit.rows.length > 0) {
        registro = resBit.rows[0];
      }

      // 3. Cerrar la falla
      await query("UPDATE fallas SET estado = 'CERRADA' WHERE id = $1", [falla.id]);

      // 4. Regresar el equipo a OPERATIVO
      await query("UPDATE equipos SET estado = 'OPERATIVO' WHERE id = $1", [falla.equipo_id]);
    }

    if (!registro) {
      const f = memoriaDB.fallas.find(item => item.id === parseInt(falla_id, 10));
      if (!f) {
        return res.status(404).json({ error: 'La falla especificada no existe.' });
      }

      registro = {
        id: memoriaDB.reparacion_bitacora.length + 1,
        falla_id: f.id,
        tecnico_id: tecnico_id || 1,
        fecha_inicio: new Date(Date.now() - (tiempoMin * 60000)).toISOString(),
        fecha_fin: new Date().toISOString(),
        tiempo_reparacion_min: tiempoMin,
        causa_raiz: causa_raiz.trim(),
        refacciones_empleadas: refacciones_empleadas.trim()
      };
      memoriaDB.reparacion_bitacora.unshift(registro);

      f.estado = 'CERRADA';
      const eq = memoriaDB.equipos.find(e => e.id === f.equipo_id);
      if (eq) {
        eq.estado = 'OPERATIVO';
      }
    }

    console.log(`[bitacoraController] Bitácora guardada para falla ${falla_id}. Equipo restablecido a OPERATIVO.`);

    return res.status(201).json({
      message: 'Reparación finalizada. Bitácora actualizada y equipo restaurado a OPERATIVO.',
      bitacora: registro
    });

  } catch (error) {
    console.error('[bitacoraController.registrarBitacora Error]', error);
    return res.status(500).json({ error: 'Error al registrar la bitácora de reparación.' });
  }
};

// GET /api/bitacora
exports.listarBitacoras = async (req, res) => {
  try {
    if (isPostgresConnected()) {
      const sql = `
        SELECT rb.*, f.folio, f.tipo_falla, f.descripcion AS falla_descripcion,
               e.nombre AS equipo_nombre, e.numero_serie, u.nombre_usuario AS tecnico_nombre
        FROM reparacion_bitacora rb
        LEFT JOIN fallas f ON rb.falla_id = f.id
        LEFT JOIN equipos e ON f.equipo_id = e.id
        LEFT JOIN tecnicos t ON rb.tecnico_id = t.id
        LEFT JOIN usuarios u ON t.usuario_id = u.id
        ORDER BY rb.fecha_fin DESC
      `;
      const result = await query(sql);
      if (result && result.rows) {
        return res.status(200).json(result.rows);
      }
    }

    const listado = memoriaDB.reparacion_bitacora.map(rb => {
      const f = memoriaDB.fallas.find(item => item.id === rb.falla_id) || {};
      const eq = memoriaDB.equipos.find(item => item.id === f.equipo_id) || {};
      const tec = memoriaDB.tecnicos.find(item => item.id === rb.tecnico_id) || {};
      return {
        ...rb,
        folio: f.folio || 'FOL-GENERAL',
        tipo_falla: f.tipo_falla || 'General',
        equipo_nombre: eq.nombre || 'Equipo Industrial',
        numero_serie: eq.numero_serie || 'N/A',
        tecnico_nombre: tec.nombre || 'Técnico Especialista'
      };
    });

    return res.status(200).json(listado);

  } catch (error) {
    console.error('[bitacoraController.listarBitacoras Error]', error);
    return res.status(500).json({ error: 'Error al consultar historial de bitácoras.' });
  }
};
