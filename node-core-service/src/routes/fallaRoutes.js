const express = require('express');
const router = express.Router();
const fallaController = require('../controllers/fallaController');

router.get('/', fallaController.obtenerFallas);
router.post('/', fallaController.reportarFalla);
router.put('/:id/estatus', fallaController.actualizarEstatusFalla);

module.exports = router;