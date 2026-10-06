const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'sicopv_db',
  port: process.env.DB_PORT || 5432,
});

pool.on('connect', () => {
  console.log('⚡ Conexión exitosa a la BD PostgreSQL (SiCoPV)');
});

module.exports = pool;