-- Base de Datos para SiCoPV / AFYP - TSR Saltillo

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    telefono VARCHAR(15),
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(30) DEFAULT 'OPERADOR', -- 'ADMIN', 'TECNICO', 'SUPERVISOR', 'OPERADOR'
    area VARCHAR(100),
    especialidad VARCHAR(100),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ubicaciones (
    id SERIAL PRIMARY KEY,
    area_equipo VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS equipos (
    id SERIAL PRIMARY KEY,
    numero_serie VARCHAR(100) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    ubicacion_id INT REFERENCES ubicaciones(id) ON DELETE SET NULL,
    descripcion TEXT,
    codigo_qr TEXT NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fallas (
    id SERIAL PRIMARY KEY,
    folio_incidencia VARCHAR(50) UNIQUE NOT NULL,
    equipo_id INT REFERENCES equipos(id) ON DELETE CASCADE,
    usuario_id INT REFERENCES usuarios(id),
    tipo_falla VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    estatus VARCHAR(30) DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'EN_PROCESO', 'SOLUCIONADA'
    fecha_reporte TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bitacora (
    id SERIAL PRIMARY KEY,
    folio_incidencia VARCHAR(50) UNIQUE REFERENCES fallas(folio_incidencia) ON DELETE CASCADE,
    tecnico_id INT REFERENCES usuarios(id),
    tiempo_inicio_reparacion TIMESTAMP,
    tiempo_fin_reparacion TIMESTAMP,
    causa_raiz TEXT,
    fotografia_url TEXT,
    estado VARCHAR(30) DEFAULT 'PENDIENTE',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS piezas (
    id SERIAL PRIMARY KEY,
    nombre_pieza VARCHAR(100) NOT NULL,
    cantidad INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bitacora_piezas (
    bitacora_id INT REFERENCES bitacora(id) ON DELETE CASCADE,
    pieza_id INT REFERENCES piezas(id) ON DELETE CASCADE,
    cantidad_utilizada INT NOT NULL DEFAULT 1,
    PRIMARY KEY (bitacora_id, pieza_id)
);