const express = require('express');
const router = express.Router();
const equipoController = require('../controllers/equipoController');

router.post('/', equipoController.registrarEquipo);
router.get('/', equipoController.listarEquipos);
router.get('/qr/:codigo_qr', equipoController.obtenerPorQR);

module.exports = router;

