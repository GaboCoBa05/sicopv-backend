-- ===================================================================
-- SiCoPV / AFYP - Datos Semilla Iniciales (TSR Saltillo)
-- ===================================================================

-- 1. Usuarios Iniciales (Contraseña: admin123 para pruebas)
INSERT INTO usuarios (usuario, nombre, correo, contrasena, rol, area, especialidad, turno)
VALUES
    ('TSR-ADMIN', 'Administrador Planta TSR', 'admin@tsr-saltillo.com', 'admin123', 'admin', 'Mantenimiento General', 'Dirección Técnica', 'Turno 1'),
    ('TSR-1001', 'Ing. Carlos Mendoza', 'cmendoza@tsr-saltillo.com', 'admin123', 'supervisor', 'Mantenimiento', 'Electrónica / PLC', 'Turno 1'),
    ('TSR-1022', 'Roberto González', 'rgonzalez@tsr-saltillo.com', 'admin123', 'tecnico', 'Mantenimiento', 'Mecánica', 'Turno 1'),
    ('TSR-1035', 'Laura Martínez', 'lmartinez@tsr-saltillo.com', 'admin123', 'tecnico', 'Celdas Robóticas', 'Robótica Industrial', 'Turno 2'),
    ('TSR-2010', 'Esteban Sánchez', 'esanchez@tsr-saltillo.com', 'admin123', 'operador', 'Producción', 'Operador CNC', 'Turno 1'),
    ('TSR-2015', 'Miguel Ángel Rivas', 'mrivas@tsr-saltillo.com', 'admin123', 'operador', 'Estampado', 'Operador Prensa', 'Turno 2')
ON CONFLICT (usuario) DO NOTHING;

-- 2. Maquinaria y Equipos Industriales
INSERT INTO maquinaria (serie, categoria, nombre, ubicacion, estado, descripcion)
VALUES
    ('TRN-001', 'Torno', 'Mazak Quick Turn 250', 'Línea 1 - Torneado', 'Operativo', 'Mecanizado de flechas y rotores de alta precisión.'),
    ('TRN-002', 'Torno', 'Haas ST-30 CNC', 'Línea 1 - Torneado', 'En Mantenimiento', 'Torno pesado de desbaste primario.'),
    ('PRN-001', 'Prensa', 'Prensa Schuler 500T', 'Línea 2 - Estampado', 'Operativo', 'Estampado continuo de paneles y soportes.'),
    ('PRN-002', 'Prensa', 'Komatsu Mecánica 300T', 'Línea 2 - Estampado', 'Fuera de Servicio', 'Troquelado de placas y refuerzos estructurales.'),
    ('ROB-001', 'Robot', 'Fanuc M-20iA/35M', 'Celda 3 - Robótica', 'Operativo', 'Celda de soldadura por arco continua.'),
    ('ROB-002', 'Robot', 'Kuka KR 60 Jet', 'Celda 3 - Robótica', 'En Espera', 'Transferencia y paletizado de material procesado.'),
    ('ROB-003', 'Robot', 'ABB IRB 6700', 'Área de Ensamble', 'Operativo', 'Manipulación y ensamble de componentes automotrices.')
ON CONFLICT (serie) DO NOTHING;

-- 3. Fallas Previas y Bitácoras para Métricas MTTR Iniciales
INSERT INTO fallas (folio, equipo_id, nombre_equipo, ubicacion, tipo_falla, prioridad, descripcion, observaciones, reportado_por, estado)
VALUES
    ('FOL-001001', 'TRN-002', 'Haas ST-30 CNC', 'Línea 1 - Torneado', 'Mecánica', 'Media', 'Desgaste severo en torreta portaherramientas.', 'Piezas con vibración', 'Esteban Sánchez', 'CERRADA'),
    ('FOL-001002', 'PRN-002', 'Komatsu Mecánica 300T', 'Línea 2 - Estampado', 'Hidráulica', 'Alta', 'Fuga de aceite en cilindro de compensación.', 'Pérdida de presión en carrera descendente', 'Miguel Ángel Rivas', 'EN_PROCESO'),
    ('FOL-001003', 'ROB-001', 'Fanuc M-20iA/35M', 'Celda 3 - Robótica', 'Eléctrica', 'Baja', 'Falso contacto en sensor inductivo de inicio de arco.', 'Revisión preventiva', 'Laura Martínez', 'CERRADA')
ON CONFLICT (folio) DO NOTHING;

-- 4. Bitácora de Cierre (para cálculo de MTTR)
INSERT INTO bitacoras (falla_id, folio, diagnostico, causa_raiz, acciones, tiempo_reparacion_minutos, tecnico_nombre)
VALUES
    (1, 'FOL-001001', 'Rodamiento cónico de torreta desgastado por fatiga de material.', 'Fatiga mecánica / Fricción', 'Reemplazo de rodamientos y ajuste de holgura micrométrica.', 45, 'Roberto González'),
    (3, 'FOL-001003', 'Cableado de sensor inductivo con aislamiento cuarteado por movimiento.', 'Desgaste de arnés flexible', 'Sustitución de tramo de cable y fijación con cinchos de uso rudo.', 25, 'Laura Martínez')
ON CONFLICT DO NOTHING;

