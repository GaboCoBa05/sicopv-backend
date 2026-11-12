const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');

router.get('/pdf/:folio', reporteController.generarReportePDF);

module.exports = router;

