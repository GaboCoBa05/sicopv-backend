const express = require('express');
const router = express.Router();
const preventivoController = require('../controllers/preventivoController');
const { verificarToken, autorizar } = require('../middlewares/authMiddleware');

router.use(verificarToken);

// Preventivos: admin, jefe de mantenimiento, técnico y supervisor.
router.post('/', autorizar('ADMIN', 'JEFE_MANTTO', 'TECNICO', 'SUPERVISOR'), preventivoController.programarPreventivo);
router.get('/', autorizar('ADMIN', 'JEFE_MANTTO', 'TECNICO', 'SUPERVISOR'), preventivoController.listarPreventivos);

// Editar / eliminar preventivos: SOLO admin
router.put('/:id', autorizar('ADMIN'), preventivoController.actualizarPreventivo);
router.delete('/:id', autorizar('ADMIN'), preventivoController.eliminarPreventivo);

module.exports = router;
