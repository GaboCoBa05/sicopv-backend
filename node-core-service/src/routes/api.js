const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const { reportarFalla, obtenerFallas } = require('../controllers/fallaController');
const { registrarAtencion, obtenerMetricasMttr } = require('../controllers/bitacoraController');

// Auth
router.post('/auth/login', login);

// Fallas
router.post('/fallas', reportarFalla);
router.get('/fallas', obtenerFallas);

// Bitácora & Métricas
router.post('/bitacora', registrarAtencion);
router.get('/bitacora/metricas', obtenerMetricasMttr);

module.exports = router;