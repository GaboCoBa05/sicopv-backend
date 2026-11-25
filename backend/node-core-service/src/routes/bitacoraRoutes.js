const express = require('express');
const router = express.Router();
const bitacoraController = require('../controllers/bitacoraController');
const { verificarToken, autorizar } = require('../middlewares/authMiddleware');

router.use(verificarToken);

// Bitácoras: consultar reparaciones para reportes y bitácora (ADMIN, JEFE_MANTTO, TECNICO, SUPERVISOR, CALIDAD)
router.get('/', autorizar('ADMIN', 'JEFE_MANTTO', 'TECNICO', 'SUPERVISOR', 'CALIDAD'), bitacoraController.listarBitacoras);
router.post('/', autorizar('ADMIN', 'JEFE_MANTTO', 'TECNICO'), bitacoraController.registrarBitacora);

// Editar / eliminar bitácoras: SOLO admin
router.put('/:id', autorizar('ADMIN'), bitacoraController.actualizarBitacora);
router.delete('/:id', autorizar('ADMIN'), bitacoraController.eliminarBitacora);

module.exports = router;
