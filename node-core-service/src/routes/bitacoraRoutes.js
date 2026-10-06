const express = require('express');
const router = express.Router();
const bitacoraController = require('../controllers/bitacoraController');

router.post('/iniciar', bitacoraController.iniciarReparacion);
router.post('/finalizar', bitacoraController.finalizarReparacion);
router.get('/metricas', bitacoraController.obtenerMetricas);

module.exports = router;