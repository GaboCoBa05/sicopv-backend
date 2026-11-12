-- ===================================================================
-- SiCoPV / AFYP - Esquema Relacional de Base de Datos (PostgreSQL 15)
-- Refactorizado para soporte integral de los 9 Casos de Uso
-- Planta: TSR Saltillo &bull; Instituto Tecnológico de Saltillo
-- ===================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Usuarios y Credenciales
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre_usuario VARCHAR(50) UNIQUE NOT NULL,
    correo VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    rol VARCHAR(30) NOT NULL CHECK (rol IN ('ADMIN', 'JEFE_MANTTO', 'TECNICO', 'OPERADOR', 'SUPERVISOR', 'CALIDAD')),
    codigo_reset VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Personal Técnico Especializado
CREATE TABLE IF NOT EXISTS tecnicos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    area VARCHAR(50) NOT NULL CHECK (area IN ('Mantenimiento', 'Eléctrica', 'Mecánica', 'Robótica', 'Producción')),
    especialidad VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Equipos y Maquinaria
CREATE TABLE IF NOT EXISTS equipos (
    id SERIAL PRIMARY KEY,
    numero_serie VARCHAR(80) UNIQUE NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    ubicacion_area VARCHAR(100) NOT NULL,
    descripcion_funcion TEXT,
    codigo_qr VARCHAR(100) UNIQUE NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'OPERATIVO' CHECK (estado IN ('OPERATIVO', 'EN_PARO', 'MANTENIMIENTO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Fallas e Incidencias Operativas
CREATE TABLE IF NOT EXISTS fallas (
    id SERIAL PRIMARY KEY,
    folio VARCHAR(30) UNIQUE NOT NULL, -- FOL-XXXXXX
    equipo_id INTEGER NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
    usuario_reporta_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    tipo_falla VARCHAR(50) NOT NULL,
    descripcion TEXT NOT NULL,
    descripcion_adicional TEXT,
    prioridad VARCHAR(20) NOT NULL CHECK (prioridad IN ('BAJA', 'MEDIA', 'ALTA', 'CRITICA')),
    estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTA' CHECK (estado IN ('ABIERTA', 'EN_PROCESO', 'CERRADA')),
    fecha_reporte TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla de Bitácora Digital y Reparaciones Realizadas
CREATE TABLE IF NOT EXISTS reparacion_bitacora (
    id SERIAL PRIMARY KEY,
    falla_id INTEGER NOT NULL REFERENCES fallas(id) ON DELETE CASCADE,
    tecnico_id INTEGER REFERENCES tecnicos(id) ON DELETE SET NULL,
    fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tiempo_reparacion_min INTEGER NOT NULL CHECK (tiempo_reparacion_min >= 0),
    causa_raiz TEXT NOT NULL,
    refacciones_empleadas TEXT NOT NULL
);

-- 6. Tabla de Programación de Mantenimiento Preventivo
CREATE TABLE IF NOT EXISTS mantenimiento_preventivo (
    id SERIAL PRIMARY KEY,
    equipo_id INTEGER NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
    tecnico_id INTEGER REFERENCES tecnicos(id) ON DELETE SET NULL,
    periodo_uso VARCHAR(80) NOT NULL,
    piezas_cambiar TEXT NOT NULL,
    descripcion_tarea TEXT NOT NULL,
    fecha_programada DATE NOT NULL DEFAULT CURRENT_DATE,
    estado VARCHAR(30) NOT NULL DEFAULT 'PROGRAMADO' CHECK (estado IN ('PROGRAMADO', 'COMPLETADO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices de aceleración
CREATE INDEX IF NOT EXISTS idx_equipos_serie ON equipos(numero_serie);
CREATE INDEX IF NOT EXISTS idx_equipos_qr ON equipos(codigo_qr);
CREATE INDEX IF NOT EXISTS idx_fallas_folio ON fallas(folio);
CREATE INDEX IF NOT EXISTS idx_fallas_equipo ON fallas(equipo_id);
CREATE INDEX IF NOT EXISTS idx_fallas_estado ON fallas(estado);
CREATE INDEX IF NOT EXISTS idx_bitacora_falla ON reparacion_bitacora(falla_id);
CREATE INDEX IF NOT EXISTS idx_preventivo_equipo ON mantenimiento_preventivo(equipo_id);
