const express = require('express');
const router = express.Router();
const equipoController = require('../controllers/equipoController');
const { verificarToken, autorizar, TODOS } = require('../middlewares/authMiddleware');

router.use(verificarToken);

// Consultar maquinaria y QR: todos los roles autenticados (el operador necesita el QR)
router.get('/', autorizar(...TODOS), equipoController.listarEquipos);
router.get('/qr/:codigo_qr', autorizar(...TODOS), equipoController.obtenerPorQR);

// Alta de maquinaria: ADMIN, JEFE_MANTTO, SUPERVISOR; edición y baja: SOLO admin
router.post('/', autorizar('ADMIN', 'JEFE_MANTTO', 'SUPERVISOR'), equipoController.registrarEquipo);
router.put('/:id', autorizar('ADMIN'), equipoController.actualizarEquipo);
router.delete('/:id', autorizar('ADMIN'), equipoController.eliminarEquipo);

module.exports = router;
