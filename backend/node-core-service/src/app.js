const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const apiRoutes = require('./routes/api');

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

// Rutas de API REST
app.use('/api', apiRoutes);

// Endpoint de verificación de salud
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'SiCoPV Node Core REST API',
    timestamp: new Date().toISOString()
  });
});

// Servicio de archivos estáticos del frontend
const frontendPath = path.resolve(__dirname, '../../frontend');
app.use('/frontend', express.static(frontendPath));

// Redirección directa al login en la raíz
app.get('/', (req, res) => {
  res.redirect('/frontend/login/login.html');
});

// Inicio del servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log('===========================================================');
  console.log(`[SiCoPV Node Core] Servidor escuchando en http://localhost:${PORT}`);
  console.log(`[Frontend] Acceso web en http://localhost:${PORT}/frontend/login/login.html`);
  console.log('===========================================================');
});

module.exports = app;

