const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Importación de enrutadores por Caso de Uso
const authRoutes = require('./routes/authRoutes');
const fallaRoutes = require('./routes/fallaRoutes');
const bitacoraRoutes = require('./routes/bitacoraRoutes');
const tecnicoRoutes = require('./routes/tecnicoRoutes');
const preventivoRoutes = require('./routes/preventivoRoutes');
const equipoRoutes = require('./routes/equipoRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reporteRoutes = require('./routes/reporteRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enrutamiento modular de API REST
app.use('/api/auth', authRoutes);
app.use('/api/fallas', fallaRoutes);
app.use('/api/bitacora', bitacoraRoutes);
app.use('/api/tecnicos', tecnicoRoutes);
app.use('/api/preventivos', preventivoRoutes);
app.use('/api/equipos', equipoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reportes', reporteRoutes);

// Alias de compatibilidad hacia endpoints legados
app.use('/api/maquinaria', equipoRoutes);
app.use('/api/usuarios', authRoutes);

// Endpoint de verificación de salud
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'SiCoPV Node Core REST API',
    version: '2.0.0',
    casos_de_uso: ['CU-01', 'CU-02', 'CU-03', 'CU-04', 'CU-05', 'CU-06', 'CU-07', 'CU-08'],
    timestamp: new Date().toISOString()
  });
});
app.get('/api/health', (req, res) => res.redirect('/health'));

// Servicio de archivos estáticos del frontend
// En local el frontend está en la raíz del repo; en Docker lo sirve nginx.
const frontendRaiz = path.resolve(__dirname, '../../../frontend');
const frontendLegacy = path.resolve(__dirname, '../../frontend');
const frontendPath = fs.existsSync(frontendRaiz) ? frontendRaiz : frontendLegacy;
app.use('/frontend', express.static(frontendPath));

// Redirección directa al login en la raíz
app.get('/', (req, res) => {
  res.redirect('/frontend/login/login.html');
});

// Inicio del servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log('===========================================================');
  console.log(`[SiCoPV Node Core] API REST activa en http://localhost:${PORT}`);
  console.log(`[Frontend] Acceso web en http://localhost:${PORT}/frontend/login/login.html`);
  console.log('===========================================================');
});

module.exports = app;
