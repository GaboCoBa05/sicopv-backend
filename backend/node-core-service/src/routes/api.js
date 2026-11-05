const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const fallaController = require('../controllers/fallaController');
const bitacoraController = require('../controllers/bitacoraController');
const { query, memoriaDB, isPostgresConnected } = require('../config/db');

// --- AUTENTICACIÓN ---
router.post('/auth/login', authController.login);

// --- GESTIÓN DE FALLAS ---
router.post('/fallas', fallaController.crearFalla);
router.get('/fallas', fallaController.listarFallas);

// --- BITÁCORA Y MTTR ---
router.post('/bitacora', bitacoraController.cerrarTicket);
router.get('/bitacora/metricas', bitacoraController.obtenerMetricasMTTR);

// --- MAQUINARIA Y EQUIPO ---
router.get('/maquinaria', async (req, res) => {
  try {
    if (isPostgresConnected()) {
      const result = await query('SELECT * FROM maquinaria ORDER BY id ASC');
      if (result && result.rows) {
        return res.status(200).json(result.rows);
      }
    }
    return res.status(200).json(memoriaDB.maquinaria);
  } catch (err) {
    return res.status(500).json({ error: 'Error al consultar maquinaria.' });
  }
});

router.post('/maquinaria', async (req, res) => {
  try {
    const { serie, categoria, nombre, ubicacion, estado, descripcion } = req.body;
    if (!serie || !nombre) {
      return res.status(400).json({ error: 'Número de serie y nombre son obligatorios.' });
    }

    const nuevo = {
      id: memoriaDB.maquinaria.length + 1,
      serie: serie.trim(),
      categoria: categoria || 'General',
      nombre: nombre.trim(),
      ubicacion: ubicacion || 'Planta',
      estado: estado || 'Operativo',
      descripcion: descripcion || ''
    };

    if (isPostgresConnected()) {
      const sql = `
        INSERT INTO maquinaria (serie, categoria, nombre, ubicacion, estado, descripcion)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const result = await query(sql, [nuevo.serie, nuevo.categoria, nuevo.nombre, nuevo.ubicacion, nuevo.estado, nuevo.descripcion]);
      if (result && result.rows && result.rows.length > 0) {
        return res.status(201).json(result.rows[0]);
      }
    }

    memoriaDB.maquinaria.unshift(nuevo);
    return res.status(201).json(nuevo);
  } catch (err) {
    return res.status(500).json({ error: 'Error al registrar maquinaria.' });
  }
});

router.patch('/maquinaria/:serie', async (req, res) => {
  try {
    const { serie } = req.params;
    const { estado } = req.body;

    if (isPostgresConnected()) {
      await query('UPDATE maquinaria SET estado = $1 WHERE serie = $2', [estado, serie]);
    }

    const m = memoriaDB.maquinaria.find(item => item.serie.toLowerCase() === serie.toLowerCase());
    if (m) {
      m.estado = estado;
    }

    return res.status(200).json({ message: 'Estado actualizado correctamente.' });
  } catch (err) {
    return res.status(500).json({ error: 'Error al actualizar estado.' });
  }
});

// --- PERSONAL TÉCNICO Y OPERADORES ---
const listarPersonal = async (req, res) => {
  try {
    if (isPostgresConnected()) {
      const result = await query('SELECT id, usuario, nombre, correo, rol, area, especialidad, turno FROM usuarios ORDER BY id ASC');
      if (result && result.rows) {
        return res.status(200).json(result.rows);
      }
    }
    return res.status(200).json(memoriaDB.usuarios);
  } catch (err) {
    return res.status(500).json({ error: 'Error al consultar técnicos.' });
  }
};

const registrarPersonal = async (req, res) => {
  try {
    const { usuario, nombre, correo, contrasena, rol, area, especialidad, turno } = req.body;

    if (!usuario || !nombre || !correo || !contrasena) {
      return res.status(400).json({ error: 'Usuario, nombre, correo y contraseña son obligatorios.' });
    }

    const nuevo = {
      id: memoriaDB.usuarios.length + 1,
      usuario: usuario.trim(),
      nombre: nombre.trim(),
      correo: correo.trim().toLowerCase(),
      contrasena: contrasena,
      rol: rol || 'tecnico',
      area: area || 'Mantenimiento',
      especialidad: especialidad || 'General',
      turno: turno || 'Turno 1'
    };

    if (isPostgresConnected()) {
      const sql = `
        INSERT INTO usuarios (usuario, nombre, correo, contrasena, rol, area, especialidad, turno)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, usuario, nombre, correo, rol, area, especialidad, turno
      `;
      const result = await query(sql, [nuevo.usuario, nuevo.nombre, nuevo.correo, nuevo.contrasena, nuevo.rol, nuevo.area, nuevo.especialidad, nuevo.turno]);
      if (result && result.rows && result.rows.length > 0) {
        return res.status(201).json(result.rows[0]);
      }
    }

    memoriaDB.usuarios.unshift(nuevo);
    return res.status(201).json(nuevo);
  } catch (err) {
    return res.status(500).json({ error: 'Error al registrar personal.' });
  }
};

router.get('/tecnicos', listarPersonal);
router.post('/tecnicos', registrarPersonal);
router.get('/usuarios', listarPersonal);
router.post('/usuarios', registrarPersonal);

module.exports = router;

