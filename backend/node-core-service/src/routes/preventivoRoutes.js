const express = require('express');
const router = express.Router();
const preventivoController = require('../controllers/preventivoController');

router.post('/', preventivoController.programarPreventivo);
router.get('/', preventivoController.listarPreventivos);

module.exports = router;

