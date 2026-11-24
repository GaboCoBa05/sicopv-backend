const { query, memoriaDB, isPostgresConnected } = require('../config/db');

// POST /api/equipos
exports.registrarEquipo = async (req, res) => {
  try {
    const { numero_serie, serie, nombre, ubicacion_area, ubicacion, descripcion_funcion, descripcion } = req.body;
    const numSerie = (numero_serie || serie || '').trim().toUpperCase();
    const nombreEquipo = (nombre || '').trim();
    const area = (ubicacion_area || ubicacion || '').trim();
    const funcion = (descripcion_funcion || descripcion || '').trim();

    if (!numSerie || !nombreEquipo || !area) {
      return res.status(400).json({ error: 'Número de serie, nombre y ubicación son obligatorios.' });
    }

    const codigoQr = `QR-TSR-${numSerie}`;

    if (isPostgresConnected()) {
      // Validación de duplicado
      const dup = await query(
        'SELECT id FROM equipos WHERE UPPER(numero_serie) = $1 OR codigo_qr = $2',
        [numSerie, codigoQr]
      );

      if (dup && dup.rows.length > 0) {
        return res.status(409).json({ error: 'Registro duplicado: El número de serie o código QR ya existe en el sistema.' });
      }

      const sql = `
        INSERT INTO equipos (numero_serie, nombre, ubicacion_area, descripcion_funcion, codigo_qr, estado)
        VALUES ($1, $2, $3, $4, $5, 'OPERATIVO')
        RETURNING *
      `;
      const result = await query(sql, [numSerie, nombreEquipo, area, funcion, codigoQr]);

      return res.status(201).json({
        message: 'Maquinaria registrada exitosamente',
        equipo: result.rows[0]
      });
    }

    // Memoria fallback
    const yaExiste = memoriaDB.equipos.some(e => e.numero_serie.toUpperCase() === numSerie || e.codigo_qr === codigoQr);
    if (yaExiste) {
      return res.status(409).json({ error: 'Registro duplicado: El número de serie o código QR ya existe en el sistema.' });
    }

    const nuevo = {
      id: memoriaDB.equipos.length + 1,
      numero_serie: numSerie,
      nombre: nombreEquipo,
      ubicacion_area: area,
      descripcion_funcion: funcion,
      codigo_qr: codigoQr,
      estado: 'OPERATIVO'
    };
    memoriaDB.equipos.unshift(nuevo);

    return res.status(201).json({
      message: 'Maquinaria registrada exitosamente',
      equipo: nuevo
    });

  } catch (error) {
    console.error('[equipoController.registrarEquipo Error]', error);
    return res.status(500).json({ error: 'Error al registrar el equipo.' });
  }
};

// GET /api/equipos
exports.listarEquipos = async (req, res) => {
  try {
    if (isPostgresConnected()) {
      const result = await query('SELECT * FROM equipos ORDER BY id ASC');
      if (result && result.rows) {
        return res.status(200).json(result.rows);
      }
    }

    return res.status(200).json(memoriaDB.equipos);
  } catch (error) {
    console.error('[equipoController.listarEquipos Error]', error);
    return res.status(500).json({ error: 'Error al consultar equipos.' });
  }
};

// GET /api/equipos/qr/:codigo_qr
exports.obtenerPorQR = async (req, res) => {
  try {
    const rawQr = decodeURIComponent(req.params.codigo_qr).trim();

    if (isPostgresConnected()) {
      const sql = 'SELECT * FROM equipos WHERE codigo_qr = $1 OR UPPER(numero_serie) = $2 LIMIT 1';
      const result = await query(sql, [rawQr, rawQr.toUpperCase()]);
      if (result && result.rows.length > 0) {
        return res.status(200).json(result.rows[0]);
      }
    }

    const eq = memoriaDB.equipos.find(e =>
      e.codigo_qr.toLowerCase() === rawQr.toLowerCase() ||
      e.numero_serie.toLowerCase() === rawQr.toLowerCase()
    );

    if (!eq) {
      return res.status(404).json({ error: 'No se encontró ningún equipo con el código QR escaneado.' });
    }

    return res.status(200).json(eq);

  } catch (error) {
    console.error('[equipoController.obtenerPorQR Error]', error);
    return res.status(500).json({ error: 'Error al consultar equipo por QR.' });
  }
};

// PUT /api/equipos/:id  (SOLO ADMIN)
exports.actualizarEquipo = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, ubicacion_area, descripcion_funcion, estado } = req.body;

    if (isPostgresConnected()) {
      const result = await query(
        `UPDATE equipos
         SET nombre = COALESCE($1, nombre),
             ubicacion_area = COALESCE($2, ubicacion_area),
             descripcion_funcion = COALESCE($3, descripcion_funcion),
             estado = COALESCE($4, estado)
         WHERE id = $5 RETURNING *`,
        [nombre || null, ubicacion_area || null, descripcion_funcion || null, estado || null, id]
      );
      if (result && result.rows.length === 0) {
        return res.status(404).json({ error: 'Equipo no encontrado.' });
      }
    } else {
      const eq = memoriaDB.equipos.find(e => e.id === Number(id));
      if (!eq) return res.status(404).json({ error: 'Equipo no encontrado.' });
      Object.assign(eq, { nombre, ubicacion_area, descripcion_funcion, estado });
    }

    return res.status(200).json({ message: 'Equipo actualizado correctamente.' });
  } catch (error) {
    console.error('[equipoController.actualizarEquipo Error]', error);
    return res.status(500).json({ error: 'Error al actualizar el equipo.' });
  }
};

// DELETE /api/equipos/:id  (SOLO ADMIN)
exports.eliminarEquipo = async (req, res) => {
  try {
    const { id } = req.params;

    if (isPostgresConnected()) {
      const result = await query('DELETE FROM equipos WHERE id = $1 RETURNING id', [id]);
      if (result && result.rows.length === 0) {
        return res.status(404).json({ error: 'Equipo no encontrado.' });
      }
    } else {
      memoriaDB.equipos = memoriaDB.equipos.filter(e => e.id !== Number(id));
    }

    return res.status(200).json({ message: 'Equipo eliminado correctamente.' });
  } catch (error) {
    console.error('[equipoController.eliminarEquipo Error]', error);
    return res.status(500).json({ error: 'Error al eliminar el equipo.' });
  }
};

