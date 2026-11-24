const express = require('express');
const router = express.Router();
const equipoController = require('../controllers/equipoController');
const { verificarToken, autorizar, TODOS } = require('../middlewares/authMiddleware');

router.use(verificarToken);

// Consultar maquinaria y QR: todos los roles autenticados (el operador necesita el QR)
router.get('/', autorizar(...TODOS), equipoController.listarEquipos);
router.get('/qr/:codigo_qr', autorizar(...TODOS), equipoController.obtenerPorQR);

// Alta, edición y baja de maquinaria: SOLO admin
router.post('/', autorizar('ADMIN'), equipoController.registrarEquipo);
router.put('/:id', autorizar('ADMIN'), equipoController.actualizarEquipo);
router.delete('/:id', autorizar('ADMIN'), equipoController.eliminarEquipo);

module.exports = router;
