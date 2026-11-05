const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'sicopv_db',
  port: process.env.DB_PORT || 5432,
});

pool.on('connect', () => {
  console.log('✅ [PostgreSQL] Conectado a la base de datos de SiCoPV');
});

module.exports = pool;