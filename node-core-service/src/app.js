require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', servicio: 'node-core-service', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`🚀 Node Core Service corriendo en puerto ${PORT}`);
});