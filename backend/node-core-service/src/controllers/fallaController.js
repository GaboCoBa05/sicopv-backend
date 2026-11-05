const { query, memoriaDB, isPostgresConnected } = require('../config/db');

exports.crearFalla = async (req, res) => {
  try {
    const {
      equipo_id,
      nombre_equipo,
      ubicacion,
      tipo,
      tipo_falla,
      prioridad,
      descripcion,
      observaciones,
      reportado_por
    } = req.body;

    if (!equipo_id || !descripcion || !prioridad) {
      return res.status(400).json({
        error: 'Los campos equipo_id, descripcion y prioridad son obligatorios.'
      });
    }

    // Generación de Folio inmutable FOL-XXXXXX
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const folio = `FOL-${randomSuffix}`;
    const tipoFinal = tipo_falla || tipo || 'Mecánica';
    const fecha = new Date().toISOString();

    let nuevaFalla = null;

    if (isPostgresConnected()) {
      const sql = `
        INSERT INTO fallas (folio, equipo_id, nombre_equipo, ubicacion, tipo_falla, prioridad, descripcion, observaciones, reportado_por, estado)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ABIERTA')
        RETURNING *
      `;
      const values = [
        folio,
        equipo_id,
        nombre_equipo || equipo_id,
        ubicacion || 'Planta General',
        tipoFinal,
        prioridad,
        descripcion,
        observaciones || '',
        reportado_por || 'Operador'
      ];
      const result = await query(sql, values);
      if (result && result.rows && result.rows.length > 0) {
        nuevaFalla = result.rows[0];
      }
    }

    if (!nuevaFalla) {
      nuevaFalla = {
        id: memoriaDB.fallas.length + 1,
        folio,
        equipo_id,
        nombre_equipo: nombre_equipo || equipo_id,
        ubicacion: ubicacion || 'Planta General',
        tipo_falla: tipoFinal,
        prioridad,
        descripcion,
        observaciones: observaciones || '',
        reportado_por: reportado_por || 'Operador',
        estado: 'ABIERTA',
        fecha_creacion: fecha
      };
      memoriaDB.fallas.unshift(nuevaFalla);
    }

    console.log(`[FallaController] Falla registrada: Folio ${folio} para equipo [${equipo_id}]`);

    return res.status(201).json({
      message: 'Falla registrada exitosamente',
      falla: nuevaFalla,
      folio: nuevaFalla.folio
    });

  } catch (error) {
    console.error('[FallaController Error]', error);
    return res.status(500).json({
      error: 'Error interno al registrar la falla.'
    });
  }
};

exports.listarFallas = async (req, res) => {
  try {
    if (isPostgresConnected()) {
      const result = await query('SELECT * FROM fallas ORDER BY fecha_creacion DESC');
      if (result && result.rows) {
        return res.status(200).json(result.rows);
      }
    }

    return res.status(200).json(memoriaDB.fallas);
  } catch (error) {
    console.error('[FallaController Error]', error);
    return res.status(500).json({
      error: 'Error interno al consultar las fallas.'
    });
  }
};

