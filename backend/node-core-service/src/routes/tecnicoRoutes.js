const express = require('express');
const router = express.Router();
const tecnicoController = require('../controllers/tecnicoController');
const { verificarToken, autorizar } = require('../middlewares/authMiddleware');

router.use(verificarToken);

// Ver personal: admin y jefe de mantenimiento
router.get('/', autorizar('ADMIN', 'JEFE_MANTTO'), tecnicoController.listarTecnicos);

// Alta de personal de mantenimiento: SOLO admin
router.post('/', autorizar('ADMIN'), tecnicoController.registrarTecnico);

// Actualizar / eliminar técnico: SOLO admin (CRUD completo)
router.put('/:id', autorizar('ADMIN'), tecnicoController.actualizarTecnico);
router.delete('/:id', autorizar('ADMIN'), tecnicoController.eliminarTecnico);

module.exports = router;
