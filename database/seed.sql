-- Usuario Admin por defecto (password de prueba hash o texto plano)
INSERT INTO usuarios (usuario, telefono, email, password_hash, rol, area, especialidad)
VALUES ('admin_tsr', '8441234567', 'admin@tsr.com.mx', '$2a$10$7R3uB/2i3j8C9O3G1E4.3uW5F9G8H7I6J5K4L3M2N1O0P9Q8R7S6', 'ADMIN', 'Mantenimiento General', 'Sistemas')
ON CONFLICT (usuario) DO NOTHING;

INSERT INTO ubicaciones (area_equipo) 
VALUES ('Ensamble A'), ('Maquinado B'), ('Fundición C') 
ON CONFLICT DO NOTHING;