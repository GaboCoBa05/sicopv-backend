const express = require('express');
const router = express.Router();
const bitacoraController = require('../controllers/bitacoraController');

router.post('/', bitacoraController.registrarBitacora);
router.get('/', bitacoraController.listarBitacoras);

module.exports = router;

