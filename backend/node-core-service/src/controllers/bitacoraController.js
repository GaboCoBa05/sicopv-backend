const { query, memoriaDB, isPostgresConnected } = require('../config/db');

exports.cerrarTicket = async (req, res) => {
  try {
    const {
      falla_id,
      folio,
      diagnostico,
      causa_raiz,
      acciones,
      tiempo_reparacion_minutos,
      tecnico_nombre
    } = req.body;

    // Reglas del sistema: diagnóstico, causa raíz y tiempo > 0 requeridos
    if (!diagnostico || !causa_raiz || !tiempo_reparacion_minutos) {
      return res.status(400).json({
        error: 'Para cerrar una incidencia es obligatorio registrar diagnóstico, causa raíz y tiempo de intervención en minutos.'
      });
    }

    const minutos = parseInt(tiempo_reparacion_minutos, 10);
    if (isNaN(minutos) || minutos <= 0) {
      return res.status(400).json({
        error: 'El tiempo de reparación debe ser un valor numérico mayor a 0 minutos.'
      });
    }

    let bitacoraGuardada = null;

    if (isPostgresConnected()) {
      const sqlBitacora = `
        INSERT INTO bitacoras (falla_id, folio, diagnostico, causa_raiz, acciones, tiempo_reparacion_minutos, tecnico_nombre)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const resultBit = await query(sqlBitacora, [
        falla_id || null,
        folio || 'FOL-GENERAL',
        diagnostico,
        causa_raiz,
        acciones || '',
        minutos,
        tecnico_nombre || 'Técnico de Guardia'
      ]);

      if (resultBit && resultBit.rows && resultBit.rows.length > 0) {
        bitacoraGuardada = resultBit.rows[0];
      }

      // Actualizar estado de la falla en DB
      if (folio) {
        await query("UPDATE fallas SET estado = 'CERRADA' WHERE folio = $1", [folio]);
      } else if (falla_id) {
        await query("UPDATE fallas SET estado = 'CERRADA' WHERE id = $1", [falla_id]);
      }
    }

    if (!bitacoraGuardada) {
      bitacoraGuardada = {
        id: memoriaDB.bitacoras.length + 1,
        falla_id: falla_id || null,
        folio: folio || 'FOL-GENERAL',
        diagnostico,
        causa_raiz,
        acciones: acciones || '',
        tiempo_reparacion_minutos: minutos,
        tecnico_nombre: tecnico_nombre || 'Técnico de Guardia',
        fecha_cierre: new Date().toISOString()
      };
      memoriaDB.bitacoras.unshift(bitacoraGuardada);

      // Actualizar en memoria
      const f = memoriaDB.fallas.find(item => item.folio === folio || item.id === falla_id);
      if (f) {
        f.estado = 'CERRADA';
      }
    }

    console.log(`[BitacoraController] Ticket cerrado: ${bitacoraGuardada.folio} (${minutos} min)`);

    return res.status(201).json({
      message: 'Incidencia cerrada y registrada en bitácora digital con éxito.',
      bitacora: bitacoraGuardada
    });

  } catch (error) {
    console.error('[BitacoraController Error]', error);
    return res.status(500).json({
      error: 'Error interno al registrar la atención en bitácora.'
    });
  }
};

exports.obtenerMetricasMTTR = async (req, res) => {
  try {
    let registros = [];

    if (isPostgresConnected()) {
      const result = await query('SELECT tiempo_reparacion_minutos FROM bitacoras');
      if (result && result.rows) {
        registros = result.rows;
      }
    } else {
      registros = memoriaDB.bitacoras;
    }

    const totalIncidencias = registros.length;
    const tiempoTotalMinutos = registros.reduce((acc, curr) => acc + parseInt(curr.tiempo_reparacion_minutos || 0, 10), 0);
    const mttrMinutos = totalIncidencias > 0 ? (tiempoTotalMinutos / totalIncidencias).toFixed(2) : 0;
    const mttrHoras = (mttrMinutos / 60).toFixed(2);

    return res.status(200).json({
      indicador: 'MTTR (Mean Time To Repair)',
      total_incidencias_resueltas: totalIncidencias,
      tiempo_acumulado_minutos: tiempoTotalMinutos,
      mttr_minutos: parseFloat(mttrMinutos),
      mttr_horas: parseFloat(mttrHoras),
      unidad_medida: 'minutos por falla'
    });

  } catch (error) {
    console.error('[BitacoraController Error]', error);
    return res.status(500).json({
      error: 'Error al calcular las métricas MTTR.'
    });
  }
};

