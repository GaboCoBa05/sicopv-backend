const express = require('express');
const router = express.Router();
const fallaController = require('../controllers/fallaController');
const { verificarToken, autorizar, TODOS } = require('../middlewares/authMiddleware');

router.use(verificarToken);

// Reportar y consultar fallas: todos los roles autenticados
router.post('/', autorizar(...TODOS), fallaController.crearFalla);
router.get('/', autorizar(...TODOS), fallaController.listarFallas);

// Editar / eliminar fallas: SOLO admin
router.put('/:id', autorizar('ADMIN'), fallaController.actualizarFalla);
router.delete('/:id', autorizar('ADMIN'), fallaController.eliminarFalla);

module.exports = router;
