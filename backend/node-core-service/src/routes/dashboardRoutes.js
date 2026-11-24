const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verificarToken, autorizar } = require('../middlewares/authMiddleware');

router.use(verificarToken);

router.get('/eficiencia', autorizar('ADMIN', 'JEFE_MANTTO'), dashboardController.obtenerEficiencia);

module.exports = router;
