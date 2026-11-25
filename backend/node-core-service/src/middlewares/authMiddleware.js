const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_vibecode_sicopv_2026';

// Verifica el JWT enviado como: Authorization: Bearer <token>
exports.verificarToken = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado: token no proporcionado' });
  }

  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
};

// Verifica el JWT si viene presente, pero no bloquea la petición cuando no hay
// token o es inválido. Se usa en rutas que funcionan tanto para sesión activa
// como para recuperación pública (p. ej. reset-password).
exports.verificarTokenOpcional = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return next();

  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    req.usuario = null;
  }
  next();
};

// autorizar('ADMIN', 'JEFE_MANTTO') -> solo esos roles pasan
exports.autorizar = (...roles) => (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const rol = String(req.usuario.rol || '').toUpperCase();
  const permitidos = roles.map(r => String(r).toUpperCase());

  if (!permitidos.includes(rol)) {
    return res.status(403).json({ error: `Acceso denegado. Rol no autorizado: ${rol}` });
  }

  next();
};

exports.TODOS = ['ADMIN', 'JEFE_MANTTO', 'TECNICO', 'OPERADOR', 'SUPERVISOR', 'CALIDAD'];
