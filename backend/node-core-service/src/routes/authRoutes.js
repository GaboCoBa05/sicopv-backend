const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const authController = require('../controllers/authController');
const { verificarToken, verificarTokenOpcional, autorizar } = require('../middlewares/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_vibecode_sicopv_2026';

// Middleware restrictivo para política de aprovisionamiento de cuentas:
// Solo un usuario autenticado con rol ADMIN puede crear cuentas.
// Si alguien sin rol ADMIN o sin sesión intenta acceder, devuelve mensaje de restricción de planta.
const exigirAdminParaRegistro = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(403).json({
      error: 'Acceso restringido: solicita tus credenciales predeterminadas al Administrador de planta'
    });
  }

  try {
    const decodificado = jwt.verify(token, JWT_SECRET);
    if (String(decodificado.rol).toUpperCase() !== 'ADMIN') {
      return res.status(403).json({
        error: 'Acceso restringido: solicita tus credenciales predeterminadas al Administrador de planta'
      });
    }
    req.usuario = decodificado;
    next();
  } catch (err) {
    return res.status(403).json({
      error: 'Acceso restringido: solicita tus credenciales predeterminadas al Administrador de planta'
    });
  }
};

// Login público
router.post('/login', authController.login);

// Aprovisionamiento de cuentas: SOLO Administrador de planta
router.post('/register', exigirAdminParaRegistro, authController.register);

// Solicitud de código de verificación al correo corporativo
router.post('/solicitar-codigo', authController.solicitarCodigo);

// Validación de código y restablecimiento de contraseña (acepta sesión activa o código por correo)
router.put('/reset-password', verificarTokenOpcional, authController.resetPassword);

// CRUD de usuarios: SOLO ADMIN
router.get('/', verificarToken, autorizar('ADMIN'), authController.listarUsuarios);
router.put('/:id', verificarToken, autorizar('ADMIN'), authController.actualizarUsuario);
router.delete('/:id', verificarToken, autorizar('ADMIN'), authController.eliminarUsuario);

module.exports = router;
