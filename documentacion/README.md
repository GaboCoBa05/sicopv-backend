# Documentación del sistema SiCoPV

## Diagramas incluidos

### arquitectura_software.png
Diagrama que muestra la arquitectura general del sistema SiCoPV.
El sistema se divide en tres capas principales:
- **Frontend**: Interfaz web desarrollada en HTML, CSS y JavaScript
- **Backend**: Servidor Node.js que expone una API REST
- **Base de datos**: PostgreSQL alojado en Supabase

Todos los servicios corren en contenedores Docker Compose.

---

### UML_ER.png
Diagrama Entidad-Relación de la base de datos del sistema.
Contiene las siguientes tablas principales:
- **Usuario**: Datos de acceso y roles del personal
- **Tecnico**: Información del personal de mantenimiento
- **Equipo**: Maquinaria registrada en planta con su código QR
- **Falla**: Reportes de fallas registradas por los operadores
- **Reparacion**: Registro del trabajo realizado por los técnicos
- **Mantenimiento**: Programación de mantenimientos preventivos
- **BitacoraDigital**: Historial de diagnósticos y reparaciones
- **Reporte**: Documentos PDF generados al cerrar una incidencia
