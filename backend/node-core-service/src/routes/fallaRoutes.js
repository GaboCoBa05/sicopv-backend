const express = require('express');
const router = express.Router();
const fallaController = require('../controllers/fallaController');

router.post('/', fallaController.crearFalla);
router.get('/', fallaController.listarFallas);

module.exports = router;

