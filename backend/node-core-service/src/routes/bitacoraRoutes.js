const express = require('express');
const router = express.Router();
const bitacoraController = require('../controllers/bitacoraController');
const { verificarToken, autorizar } = require('../middlewares/authMiddleware');

router.use(verificarToken);

// Bitácoras: admin, jefe de mantenimiento y técnico. El operador NO tiene acceso.
router.post('/', autorizar('ADMIN', 'JEFE_MANTTO', 'TECNICO'), bitacoraController.registrarBitacora);
router.get('/', autorizar('ADMIN', 'JEFE_MANTTO', 'TECNICO'), bitacoraController.listarBitacoras);

// Editar / eliminar bitácoras: SOLO admin
router.put('/:id', autorizar('ADMIN'), bitacoraController.actualizarBitacora);
router.delete('/:id', autorizar('ADMIN'), bitacoraController.eliminarBitacora);

module.exports = router;
