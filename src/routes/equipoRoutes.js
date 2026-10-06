const express = require('express');
const router = express.Router();
const equipoController = require('../controllers/equipoController');

router.get('/', equipoController.obtenerEquipos);
router.post('/', equipoController.crearEquipo);
router.get('/serie/:serie', equipoController.obtenerEquipoPorSerie);

module.exports = router;