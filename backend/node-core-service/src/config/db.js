const { Pool } = require('pg');

// Única fuente de verdad: PostgreSQL. No existe capa de datos simulada ni
// usuarios semilla inyectados en runtime; los datos viven en la base.
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'sicopv_db',
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DB] Error inesperado en el pool de conexiones:', err.message);
});

// Comprobación de conexión (solo diagnóstico al arranque)
pool.connect()
  .then(client => {
    console.log('[DB] Conectado exitosamente a PostgreSQL (' + (process.env.DB_HOST || 'localhost') + ':' + (process.env.DB_PORT || '5432') + ')');
    client.release();
  })
  .catch(err => {
    console.error('[DB] No se pudo conectar a PostgreSQL (' + err.message + '). La API responderá con error hasta que la base esté disponible.');
  });

// Ejecuta una consulta y propaga cualquier error. Los controladores deciden
// el código HTTP; nunca se sustituyen datos reales por datos inventados.
async function query(text, params = []) {
  return pool.query(text, params);
}

module.exports = {
  pool,
  query
};
