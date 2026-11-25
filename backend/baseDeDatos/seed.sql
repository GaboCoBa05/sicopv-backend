-- ===================================================================
-- SiCoPV / AFYP - Datos Semilla Iniciales (TSR Saltillo)
-- ===================================================================

-- 1. Usuarios del Sistema
-- Credenciales predeterminadas para pruebas funcionales por rol:
-- ADMIN: admin_tsr / admin@tsrsaltillo.com (Clave: AdminTSR2026!)
-- JEFE_MANTTO: cmendoza / cmendoza@tsr-saltillo.com (Clave: admin123)
-- TECNICO: rgonzalez / rgonzalez@tsr-saltillo.com (Clave: admin123)
-- TECNICO: lmartinez / lmartinez@tsr-saltillo.com (Clave: admin123)
-- OPERADOR: esanchez / esanchez@tsr-saltillo.com (Clave: admin123)
-- OPERADOR: mrivas / mrivas@tsr-saltillo.com (Clave: admin123)
-- SUPERVISOR: supervisor_tsr / supervisor@tsrsaltillo.com (Clave: admin123)
-- CALIDAD: calidad_tsr / calidad@tsrsaltillo.com (Clave: admin123)

INSERT INTO usuarios (id, nombre_usuario, correo, password_hash, telefono, rol)
VALUES
    (1, 'admin_tsr', 'admin@tsrsaltillo.com', '$2a$10$CRdBxf2.fUeuadmZe8zsDeJ8nykUs.hefXoodCfCSV60nxUWGvF/y', '8441112233', 'ADMIN'),
    (2, 'admin', 'admin@tsr-saltillo.com', '$2a$10$CRdBxf2.fUeuadmZe8zsDeJ8nykUs.hefXoodCfCSV60nxUWGvF/y', '8441112233', 'ADMIN'),
    (3, 'cmendoza', 'cmendoza@tsr-saltillo.com', '$2a$10$cZUAVdeHryKBvx7vk1k3keiX1XuSeGvtq9bOHzaeoHh6x1ZO0C22G', '8442223344', 'JEFE_MANTTO'),
    (4, 'rgonzalez', 'rgonzalez@tsr-saltillo.com', '$2a$10$cZUAVdeHryKBvx7vk1k3keiX1XuSeGvtq9bOHzaeoHh6x1ZO0C22G', '8443334455', 'TECNICO'),
    (5, 'lmartinez', 'lmartinez@tsr-saltillo.com', '$2a$10$cZUAVdeHryKBvx7vk1k3keiX1XuSeGvtq9bOHzaeoHh6x1ZO0C22G', '8444445566', 'TECNICO'),
    (6, 'esanchez', 'esanchez@tsr-saltillo.com', '$2a$10$cZUAVdeHryKBvx7vk1k3keiX1XuSeGvtq9bOHzaeoHh6x1ZO0C22G', '8445556677', 'OPERADOR'),
    (7, 'mrivas', 'mrivas@tsr-saltillo.com', '$2a$10$cZUAVdeHryKBvx7vk1k3keiX1XuSeGvtq9bOHzaeoHh6x1ZO0C22G', '8446667788', 'OPERADOR'),
    (8, 'supervisor_tsr', 'supervisor@tsrsaltillo.com', '$2a$10$cZUAVdeHryKBvx7vk1k3keiX1XuSeGvtq9bOHzaeoHh6x1ZO0C22G', '8447778899', 'SUPERVISOR'),
    (9, 'calidad_tsr', 'calidad@tsrsaltillo.com', '$2a$10$cZUAVdeHryKBvx7vk1k3keiX1XuSeGvtq9bOHzaeoHh6x1ZO0C22G', '8448889900', 'CALIDAD')
ON CONFLICT (nombre_usuario) DO UPDATE
SET correo = EXCLUDED.correo,
    password_hash = EXCLUDED.password_hash,
    rol = EXCLUDED.rol;

-- 2. Personal Técnico (usuario_id referencia usuarios)
INSERT INTO tecnicos (id, usuario_id, area, especialidad)
VALUES
    (1, 4, 'Mecánica', 'Ajuste de Husillos y Rodamientos'),
    (2, 5, 'Eléctrica', 'Automatización PLC y Robótica Industrial'),
    (3, 3, 'Mantenimiento', 'Diagnóstico General y Confiabilidad')
ON CONFLICT (id) DO NOTHING;

-- 3. Equipos y Maquinaria de Planta
INSERT INTO equipos (id, numero_serie, nombre, ubicacion_area, descripcion_funcion, codigo_qr, estado)
VALUES
    (1, 'TRN-001', 'Torno CNC Mazak Quick Turn 250', 'Línea 1 - Torneado', 'Mecanizado de flechas y rotores automotrices.', 'QR-TSR-TRN-001', 'OPERATIVO'),
    (2, 'TRN-002', 'Torno Paralelo Haas ST-30', 'Línea 1 - Torneado', 'Desbaste primario y roscado de piezas pesadas.', 'QR-TSR-TRN-002', 'EN_PARO'),
    (3, 'PRN-001', 'Prensa Hidráulica Schuler 500T', 'Línea 2 - Estampado', 'Estampado progresivo de paneles estructurales.', 'QR-TSR-PRN-001', 'OPERATIVO'),
    (4, 'PRN-002', 'Prensa Mecánica Komatsu 300T', 'Línea 2 - Estampado', 'Troquelado de soportes y placas de fijación.', 'QR-TSR-PRN-002', 'MANTENIMIENTO'),
    (5, 'ROB-001', 'Robot Soldadura Fanuc M-20iA/35M', 'Celda 3 - Robótica', 'Soldadura por arco MIG/MAG robotizada continua.', 'QR-TSR-ROB-001', 'OPERATIVO'),
    (6, 'ROB-002', 'Robot Transferencia Kuka KR 60', 'Celda 3 - Robótica', 'Manipulación y paletizado de subensambles.', 'QR-TSR-ROB-002', 'OPERATIVO')
ON CONFLICT (numero_serie) DO NOTHING;

-- 4. Registro de Fallas Históricas
INSERT INTO fallas (id, folio, equipo_id, usuario_reporta_id, tipo_falla, descripcion, descripcion_adicional, prioridad, estado, fecha_reporte)
VALUES
    (1, 'FOL-100201', 1, 6, 'Mecánica', 'Vibración excesiva en el cabezal principal.', 'Ocurrió durante el ciclo de corte a 2500 RPM.', 'MEDIA', 'CERRADA', NOW() - INTERVAL '6 days'),
    (2, 'FOL-100202', 3, 7, 'Hidráulica', 'Fuga de aceite en manguera de alta presión del pistón auxiliar.', 'Pérdida de presión en el manómetro.', 'ALTA', 'CERRADA', NOW() - INTERVAL '3 days'),
    (3, 'FOL-100203', 2, 6, 'Eléctrica', 'Paro de emergencia activado por falla en servo drive del eje Z.', 'Código de alarma E-402 en panel Fanuc.', 'CRITICA', 'ABIERTA', NOW() - INTERVAL '2 hours'),
    (4, 'FOL-100204', 5, 6, 'Neumática', 'Baja presión en mordaza neumática del herramental.', 'Fuga audible en conector rápido.', 'BAJA', 'EN_PROCESO', NOW() - INTERVAL '1 day')
ON CONFLICT (folio) DO NOTHING;

-- 5. Bitácoras de Reparación (Cierre de Tickets)
INSERT INTO reparacion_bitacora (id, falla_id, tecnico_id, fecha_inicio, fecha_fin, tiempo_reparacion_min, causa_raiz, refacciones_empleadas)
VALUES
    (1, 1, 1, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days' + INTERVAL '45 minutes', 45, 'Desgaste por fatiga de rodamientos de apoyo axial.', '2x Rodamiento Timken 32010X, 1x Retén vitón'),
    (2, 2, 1, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '30 minutes', 30, 'Fatiga térmica y roce contra estructura de prensa.', '1x Manguera Parker 4 hilos 3/4 pulg, 2x Conectores JIC hembra')
ON CONFLICT (id) DO NOTHING;

-- 6. Mantenimiento Preventivo Programado
INSERT INTO mantenimiento_preventivo (id, equipo_id, tecnico_id, periodo_uso, piezas_cambiar, descripcion_tarea, fecha_programada, estado)
VALUES
    (1, 1, 1, 'Trimestral (500 hrs)', 'Filtro de aceite, sellos de husillo, refrigerante sintético', 'Cambio de fluidos, calibración geométrica de torreta y engrase centralizado.', CURRENT_DATE + INTERVAL '5 days', 'PROGRAMADO'),
    (2, 3, 1, 'Semestral (1000 hrs)', 'Empaques de cilindro maestro, filtro hidráulico de succión', 'Inspección de válvulas proporcionales y prueba de presión estática a 210 bar.', CURRENT_DATE + INTERVAL '12 days', 'PROGRAMADO'),
    (3, 5, 2, 'Mensual (200 hrs)', 'Toberas de antorcha, difusores cerámicos, cable de masa', 'Limpieza de riel, verificación de juego en muñeca J5/J6 y respaldo de programa.', CURRENT_DATE - INTERVAL '2 days', 'COMPLETADO')
ON CONFLICT (id) DO NOTHING;

-- Ajuste de secuencias
SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios));
SELECT setval('tecnicos_id_seq', (SELECT MAX(id) FROM tecnicos));
SELECT setval('equipos_id_seq', (SELECT MAX(id) FROM equipos));
SELECT setval('fallas_id_seq', (SELECT MAX(id) FROM fallas));
SELECT setval('reparacion_bitacora_id_seq', (SELECT MAX(id) FROM reparacion_bitacora));
SELECT setval('mantenimiento_preventivo_id_seq', (SELECT MAX(id) FROM mantenimiento_preventivo));
