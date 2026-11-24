const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verificarToken, autorizar } = require('../middlewares/authMiddleware');

// Login público
router.post('/login', authController.login);

// Crear usuarios: SOLO el administrador (evita que cualquiera se registre como ADMIN)
router.post('/register', verificarToken, autorizar('ADMIN'), authController.register);

// Recuperación de contraseña (pública)
router.put('/reset-password', authController.resetPassword);

// CRUD de usuarios: SOLO admin (montado también en /api/usuarios)
router.get('/', verificarToken, autorizar('ADMIN'), authController.listarUsuarios);
router.put('/:id', verificarToken, autorizar('ADMIN'), authController.actualizarUsuario);
router.delete('/:id', verificarToken, autorizar('ADMIN'), authController.eliminarUsuario);

module.exports = router;
