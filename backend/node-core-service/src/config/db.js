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

// Comprobación de conexión a PostgreSQL
pool.connect()
  .then(client => {
    isConnected = true;
    console.log('[DB] Conectado exitosamente a PostgreSQL (' + (process.env.DB_HOST || 'localhost') + ':' + (process.env.DB_PORT || '5432') + ')');
    client.release();
  })
  .catch(err => {
    isConnected = false;
    console.warn('[DB] PostgreSQL no disponible (' + err.message + '). Activando capa de persistencia en memoria.');
  });

// Estructura de almacenamiento en memoria tolerante a fallos
const memoriaDB = {
  usuarios: [
    { id: 1, nombre_usuario: 'admin', correo: 'admin@tsr-saltillo.com', password_hash: 'admin123', telefono: '8441112233', rol: 'ADMIN', codigo_reset: null },
    { id: 2, nombre_usuario: 'cmendoza', correo: 'cmendoza@tsr-saltillo.com', password_hash: 'admin123', telefono: '8442223344', rol: 'JEFE_MANTTO', codigo_reset: null },
    { id: 3, nombre_usuario: 'rgonzalez', correo: 'rgonzalez@tsr-saltillo.com', password_hash: 'admin123', telefono: '8443334455', rol: 'TECNICO', codigo_reset: null },
    { id: 4, nombre_usuario: 'lmartinez', correo: 'lmartinez@tsr-saltillo.com', password_hash: 'admin123', telefono: '8444445566', rol: 'TECNICO', codigo_reset: null },
    { id: 5, nombre_usuario: 'esanchez', correo: 'esanchez@tsr-saltillo.com', password_hash: 'admin123', telefono: '8445556677', rol: 'OPERADOR', codigo_reset: null },
    { id: 6, nombre_usuario: 'mrivas', correo: 'mrivas@tsr-saltillo.com', password_hash: 'admin123', telefono: '8446667788', rol: 'OPERADOR', codigo_reset: null }
  ],
  tecnicos: [
    { id: 1, usuario_id: 3, area: 'Mecánica', especialidad: 'Ajuste de Husillos y Rodamientos', nombre: 'Roberto González', correo: 'rgonzalez@tsr-saltillo.com' },
    { id: 2, usuario_id: 4, area: 'Eléctrica', especialidad: 'Automatización PLC y Robótica Industrial', nombre: 'Laura Martínez', correo: 'lmartinez@tsr-saltillo.com' },
    { id: 3, usuario_id: 2, area: 'Mantenimiento', especialidad: 'Diagnóstico General y Confiabilidad', nombre: 'Ing. Carlos Mendoza', correo: 'cmendoza@tsr-saltillo.com' }
  ],
  equipos: [
    { id: 1, numero_serie: 'TRN-001', nombre: 'Torno CNC Mazak Quick Turn 250', ubicacion_area: 'Línea 1 - Torneado', descripcion_funcion: 'Mecanizado de flechas y rotores automotrices.', codigo_qr: 'QR-TSR-TRN-001', estado: 'OPERATIVO' },
    { id: 2, numero_serie: 'TRN-002', nombre: 'Torno Paralelo Haas ST-30', ubicacion_area: 'Línea 1 - Torneado', descripcion_funcion: 'Desbaste primario y roscado de piezas pesadas.', codigo_qr: 'QR-TSR-TRN-002', estado: 'EN_PARO' },
    { id: 3, numero_serie: 'PRN-001', nombre: 'Prensa Hidráulica Schuler 500T', ubicacion_area: 'Línea 2 - Estampado', descripcion_funcion: 'Estampado progresivo de paneles estructurales.', codigo_qr: 'QR-TSR-PRN-001', estado: 'OPERATIVO' },
    { id: 4, numero_serie: 'PRN-002', nombre: 'Prensa Mecánica Komatsu 300T', ubicacion_area: 'Línea 2 - Estampado', descripcion_funcion: 'Troquelado de soportes y placas de fijación.', codigo_qr: 'QR-TSR-PRN-002', estado: 'MANTENIMIENTO' },
    { id: 5, numero_serie: 'ROB-001', nombre: 'Robot Soldadura Fanuc M-20iA/35M', ubicacion_area: 'Celda 3 - Robótica', descripcion_funcion: 'Soldadura por arco MIG/MAG robotizada continua.', codigo_qr: 'QR-TSR-ROB-001', estado: 'OPERATIVO' },
    { id: 6, numero_serie: 'ROB-002', nombre: 'Robot Transferencia Kuka KR 60', ubicacion_area: 'Celda 3 - Robótica', descripcion_funcion: 'Manipulación y paletizado de subensambles.', codigo_qr: 'QR-TSR-ROB-002', estado: 'OPERATIVO' }
  ],
  fallas: [
    { id: 1, folio: 'FOL-100201', equipo_id: 1, usuario_reporta_id: 5, tipo_falla: 'Mecánica', descripcion: 'Vibración excesiva en el cabezal principal.', descripcion_adicional: 'Ocurrió a 2500 RPM.', prioridad: 'MEDIA', estado: 'CERRADA', fecha_reporte: new Date(Date.now() - 518400000).toISOString() },
    { id: 2, folio: 'FOL-100202', equipo_id: 3, usuario_reporta_id: 6, tipo_falla: 'Hidráulica', descripcion: 'Fuga de aceite en manguera de alta presión.', descripcion_adicional: 'Pérdida de presión en manómetro.', prioridad: 'ALTA', estado: 'CERRADA', fecha_reporte: new Date(Date.now() - 259200000).toISOString() },
    { id: 3, folio: 'FOL-100203', equipo_id: 2, usuario_reporta_id: 5, tipo_falla: 'Eléctrica', descripcion: 'Paro de emergencia por falla en servo drive Z.', descripcion_adicional: 'Código E-402 Fanuc.', prioridad: 'CRITICA', estado: 'ABIERTA', fecha_reporte: new Date(Date.now() - 7200000).toISOString() }
  ],
  reparacion_bitacora: [
    { id: 1, falla_id: 1, tecnico_id: 1, fecha_inicio: new Date(Date.now() - 518400000).toISOString(), fecha_fin: new Date(Date.now() - 515700000).toISOString(), tiempo_reparacion_min: 45, causa_raiz: 'Desgaste por fatiga de rodamientos de apoyo axial.', refacciones_empleadas: '2x Rodamiento Timken 32010X, 1x Retén vitón' },
    { id: 2, falla_id: 2, tecnico_id: 1, fecha_inicio: new Date(Date.now() - 259200000).toISOString(), fecha_fin: new Date(Date.now() - 257400000).toISOString(), tiempo_reparacion_min: 30, causa_raiz: 'Fatiga térmica y roce contra estructura de prensa.', refacciones_empleadas: '1x Manguera Parker 4 hilos 3/4 pulg, 2x Conectores JIC hembra' }
  ],
  mantenimiento_preventivo: [
    { id: 1, equipo_id: 1, tecnico_id: 1, periodo_uso: 'Trimestral (500 hrs)', piezas_cambiar: 'Filtro de aceite, sellos de husillo', descripcion_tarea: 'Cambio de fluidos y calibración geométrica de torreta.', fecha_programada: new Date(Date.now() + 432000000).toISOString().split('T')[0], estado: 'PROGRAMADO' },
    { id: 2, equipo_id: 3, tecnico_id: 1, periodo_uso: 'Semestral (1000 hrs)', piezas_cambiar: 'Empaques de cilindro maestro, filtro hidráulico', descripcion_tarea: 'Inspección de válvulas proporcionales y prueba estática a 210 bar.', fecha_programada: new Date(Date.now() + 1036800000).toISOString().split('T')[0], estado: 'PROGRAMADO' }
  ]
};

async function query(text, params = []) {
  if (isConnected) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      console.warn('[DB Error Query]', err.message);
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
