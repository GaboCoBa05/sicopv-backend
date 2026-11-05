-- ===================================================================
-- SiCoPV / AFYP - Esquema Relacional de Base de Datos (PostgreSQL 15)
-- Planta: TSR Saltillo
-- ===================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Usuarios / Personal Técnico y Operativo
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    correo VARCHAR(120) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    rol VARCHAR(30) NOT NULL DEFAULT 'operador', -- 'admin', 'supervisor', 'tecnico', 'operador'
    area VARCHAR(80) NOT NULL,
    especialidad VARCHAR(80),
    turno VARCHAR(30) NOT NULL DEFAULT 'Turno 1',
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Maquinaria y Equipos Industriales
CREATE TABLE IF NOT EXISTS maquinaria (
    id SERIAL PRIMARY KEY,
    serie VARCHAR(80) UNIQUE NOT NULL,
    categoria VARCHAR(50) NOT NULL, -- 'Torno', 'Prensa', 'Robot', etc.
    nombre VARCHAR(120) NOT NULL,
    ubicacion VARCHAR(100) NOT NULL,
    estado VARCHAR(40) NOT NULL DEFAULT 'Operativo', -- 'Operativo', 'En Mantenimiento', 'Fuera de Servicio', 'En Espera'
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Registro de Fallas de Maquinaria
CREATE TABLE IF NOT EXISTS fallas (
    id SERIAL PRIMARY KEY,
    folio VARCHAR(30) UNIQUE NOT NULL,
    equipo_id VARCHAR(80) NOT NULL,
    nombre_equipo VARCHAR(120),
    ubicacion VARCHAR(100),
    tipo_falla VARCHAR(50) NOT NULL,
    prioridad VARCHAR(20) NOT NULL, -- 'Baja', 'Media', 'Alta', 'Crítica'
    descripcion TEXT NOT NULL,
    observaciones TEXT,
    reportado_por VARCHAR(120),
    estado VARCHAR(30) NOT NULL DEFAULT 'ABIERTA', -- 'ABIERTA', 'EN_PROCESO', 'CERRADA'
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Bitácora Digital y Mantenimiento Correctivo
CREATE TABLE IF NOT EXISTS bitacoras (
    id SERIAL PRIMARY KEY,
    falla_id INTEGER REFERENCES fallas(id) ON DELETE SET NULL,
    folio VARCHAR(30) NOT NULL,
    diagnostico TEXT NOT NULL,
    causa_raiz VARCHAR(100) NOT NULL,
    acciones TEXT NOT NULL,
    tiempo_reparacion_minutos INTEGER NOT NULL CHECK (tiempo_reparacion_minutos > 0),
    tecnico_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    tecnico_nombre VARCHAR(120) NOT NULL,
    fecha_cierre TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices de aceleración para consultas críticas
CREATE INDEX IF NOT EXISTS idx_fallas_folio ON fallas(folio);
CREATE INDEX IF NOT EXISTS idx_fallas_estado ON fallas(estado);
CREATE INDEX IF NOT EXISTS idx_maquinaria_serie ON maquinaria(serie);
CREATE INDEX IF NOT EXISTS idx_bitacora_falla ON bitacoras(falla_id);

