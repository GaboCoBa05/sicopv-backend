const express = require('express');
const router = express.Router();
const tecnicoController = require('../controllers/tecnicoController');

router.post('/', tecnicoController.registrarTecnico);
router.get('/', tecnicoController.listarTecnicos);

module.exports = router;

