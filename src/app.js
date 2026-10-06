const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const equipoRoutes = require('./routes/equipoRoutes');
const fallaRoutes = require('./routes/fallaRoutes');
const bitacoraRoutes = require('./routes/bitacoraRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Endpoint base de healthcheck
app.get('/', (req, res) => {
  res.json({
    sistema: "SiCoPV - AFYP (TSR Saltillo)",
    modulo: "Backend API REST",
    estado: "🚀 API en línea y funcionando",
    version: "1.0.0"
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/equipos', equipoRoutes);
app.use('/api/fallas', fallaRoutes);
app.use('/api/bitacora', bitacoraRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔥 Servidor SiCoPV corriendo en http://localhost:${PORT}`);
});