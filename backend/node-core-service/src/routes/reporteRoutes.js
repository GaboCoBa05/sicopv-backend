const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const { verificarToken, autorizar } = require('../middlewares/authMiddleware');

router.use(verificarToken);

router.get('/pdf/:folio', autorizar('ADMIN', 'JEFE_MANTTO', 'TECNICO'), reporteController.generarReportePDF);

module.exports = router;
