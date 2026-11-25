const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verificarToken, autorizar } = require('../middlewares/authMiddleware');

router.use(verificarToken);

// Métricas visibles para los roles que tienen acceso al Dashboard
router.get('/eficiencia', autorizar('ADMIN', 'JEFE_MANTTO', 'SUPERVISOR', 'CALIDAD'), dashboardController.obtenerEficiencia);

module.exports = router;
