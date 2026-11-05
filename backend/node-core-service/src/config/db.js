const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'sicopv_db',
  connectionTimeoutMillis: 3000,
});

let isConnected = false;

// Comprobación inicial de conectividad
pool.connect()
  .then(client => {
    isConnected = true;
    console.log('[DB] Conexión exitosa a PostgreSQL (' + (process.env.DB_HOST || 'localhost') + ':' + (process.env.DB_PORT || '5432') + ')');
    client.release();
  })
  .catch(err => {
    isConnected = false;
    console.warn('[DB] PostgreSQL no disponible (' + err.message + '). Activando capa de resiliencia en memoria.');
  });

// Base de datos simulada en memoria para tolerancia a fallos
const memoriaDB = {
  usuarios: [
    { id: 1, usuario: 'TSR-ADMIN', nombre: 'Administrador Planta TSR', correo: 'admin@tsr-saltillo.com', contrasena: 'admin123', rol: 'admin', area: 'Mantenimiento General', especialidad: 'Dirección Técnica', turno: 'Turno 1' },
    { id: 2, usuario: 'TSR-1001', nombre: 'Ing. Carlos Mendoza', correo: 'cmendoza@tsr-saltillo.com', contrasena: 'admin123', rol: 'supervisor', area: 'Mantenimiento', especialidad: 'Electrónica / PLC', turno: 'Turno 1' },
    { id: 3, usuario: 'TSR-1022', nombre: 'Roberto González', correo: 'rgonzalez@tsr-saltillo.com', contrasena: 'admin123', rol: 'tecnico', area: 'Mantenimiento', especialidad: 'Mecánica', turno: 'Turno 1' },
    { id: 4, usuario: 'TSR-1035', nombre: 'Laura Martínez', correo: 'lmartinez@tsr-saltillo.com', contrasena: 'admin123', rol: 'tecnico', area: 'Celdas Robóticas', especialidad: 'Robótica Industrial', turno: 'Turno 2' },
    { id: 5, usuario: 'TSR-2010', nombre: 'Esteban Sánchez', correo: 'esanchez@tsr-saltillo.com', contrasena: 'admin123', rol: 'operador', area: 'Producción', especialidad: 'Operador CNC', turno: 'Turno 1' },
    { id: 6, usuario: 'TSR-2015', nombre: 'Miguel Ángel Rivas', correo: 'mrivas@tsr-saltillo.com', contrasena: 'admin123', rol: 'operador', area: 'Estampado', especialidad: 'Operador Prensa', turno: 'Turno 2' }
  ],
  maquinaria: [
    { id: 1, serie: 'TRN-001', categoria: 'Torno', nombre: 'Mazak Quick Turn 250', ubicacion: 'Línea 1 - Torneado', estado: 'Operativo', descripcion: 'Mecanizado de flechas y rotores.' },
    { id: 2, serie: 'TRN-002', categoria: 'Torno', nombre: 'Haas ST-30 CNC', ubicacion: 'Línea 1 - Torneado', estado: 'En Mantenimiento', descripcion: 'Torno pesado de desbaste primario.' },
    { id: 3, serie: 'PRN-001', categoria: 'Prensa', nombre: 'Prensa Schuler 500T', ubicacion: 'Línea 2 - Estampado', estado: 'Operativo', descripcion: 'Estampado de paneles.' },
    { id: 4, serie: 'PRN-002', categoria: 'Prensa', nombre: 'Komatsu Mecánica 300T', ubicacion: 'Línea 2 - Estampado', estado: 'Fuera de Servicio', descripcion: 'Troquelado de placas.' },
    { id: 5, serie: 'ROB-001', categoria: 'Robot', nombre: 'Fanuc M-20iA/35M', ubicacion: 'Celda 3 - Robótica', estado: 'Operativo', descripcion: 'Soldadura por arco continua.' },
    { id: 6, serie: 'ROB-002', categoria: 'Robot', nombre: 'Kuka KR 60 Jet', ubicacion: 'Celda 3 - Robótica', estado: 'En Espera', descripcion: 'Paletizado y transferencia.' },
    { id: 7, serie: 'ROB-003', categoria: 'Robot', nombre: 'ABB IRB 6700', ubicacion: 'Área de Ensamble', estado: 'Operativo', descripcion: 'Ensamble de componentes.' }
  ],
  fallas: [
    { id: 1, folio: 'FOL-001001', equipo_id: 'TRN-002', nombre_equipo: 'Haas ST-30 CNC', ubicacion: 'Línea 1 - Torneado', tipo_falla: 'Mecánica', prioridad: 'Media', descripcion: 'Desgaste en torreta portaherramientas.', observaciones: 'Vibración', reportado_por: 'Esteban Sánchez', estado: 'CERRADA', fecha_creacion: new Date().toISOString() },
    { id: 2, folio: 'FOL-001002', equipo_id: 'PRN-002', nombre_equipo: 'Komatsu Mecánica 300T', ubicacion: 'Línea 2 - Estampado', tipo_falla: 'Hidráulica', prioridad: 'Alta', descripcion: 'Fuga de aceite en cilindro.', observaciones: 'Pérdida de presión', reportado_por: 'Miguel Ángel Rivas', estado: 'EN_PROCESO', fecha_creacion: new Date().toISOString() }
  ],
  bitacoras: [
    { id: 1, falla_id: 1, folio: 'FOL-001001', diagnostico: 'Rodamiento desgastado.', causa_raiz: 'Fatiga mecánica', acciones: 'Reemplazo de rodamientos.', tiempo_reparacion_minutos: 45, tecnico_nombre: 'Roberto González', fecha_cierre: new Date().toISOString() }
  ]
};

async function query(text, params = []) {
  if (isConnected) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      console.warn('[DB Error] Reintentando o utilizando fallback:', err.message);
    }
  }
  return null;
}

module.exports = {
  pool,
  query,
  memoriaDB,
  isPostgresConnected: () => isConnected
};

