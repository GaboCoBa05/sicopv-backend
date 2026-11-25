# Frontend — SiCoPV (Sistema de Control de Producción y Verificación)

Interfaz web operativa desarrollada en **HTML5, CSS3 y JavaScript (ES6+)** para gestionar el mantenimiento industrial, reporte de fallas en tiempo real e indicadores KPI.

---

## Estructura de Carpetas

```text
frontend/
├── index.html                  # Redirección automática hacia el inicio de sesión
├── README.md                   # Documentación del frontend
├── Login/                      # Autenticación, registro, recuperación de clave y redirección por rol
│   ├── login.html
│   ├── Registro.html
│   └── ActualizarContra.html
├── Dashboard/                  # Tablero administrativo con KPIs (MTBF, MTTR, Disponibilidad) y perfil
│   └── dashboard.html
├── IngresoMaquinaria/          # Alta de activos en inventario y generación/impresión de etiquetas QR
│   ├── ingreso_maquinaria.html
│   └── codigo_qr.html
├── FallaEquipo/                # Levantamiento de fallas por QR con alertas en vivo y menú rápido
│   ├── Fallas.html
│   └── seleccion.html
├── BitacoraDigital/            # Atención cronometrada de fallas, refacciones, causa raíz y cierre
│   ├── bitacora_digital.html
│   └── bitacora.html
├── MantenimientoPreventivo/    # Programación periódica de intervenciones y cambios de piezas
│   ├── mantenimiento_preventivo.html
│   └── preventivo.html
├── RegistrarTecnico/           # Alta de personal técnico por área/especialidad y validación de datos
│   └── registrar_tecnico.html
└── Reportes/                   # Vista previa de bitácoras cerradas y descarga de certificados PDF
    ├── reporte_pdf.html
    └── reportes.html