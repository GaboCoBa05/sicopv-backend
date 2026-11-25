const express = require('express');
const router = express.Router();
const tecnicoController = require('../controllers/tecnicoController');
const { verificarToken, autorizar } = require('../middlewares/authMiddleware');

router.use(verificarToken);

// Ver personal: admin, jefe de mantenimiento y supervisor
router.get('/', autorizar('ADMIN', 'JEFE_MANTTO', 'SUPERVISOR'), tecnicoController.listarTecnicos);

// Alta de personal de mantenimiento: admin, jefe de mantenimiento y supervisor
router.post('/', autorizar('ADMIN', 'JEFE_MANTTO', 'SUPERVISOR'), tecnicoController.registrarTecnico);

// Actualizar / eliminar técnico: SOLO admin (CRUD completo)
router.put('/:id', autorizar('ADMIN'), tecnicoController.actualizarTecnico);
router.delete('/:id', autorizar('ADMIN'), tecnicoController.eliminarTecnico);

module.exports = router;
