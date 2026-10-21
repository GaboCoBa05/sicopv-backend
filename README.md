# SiCoPV — Backend & Base de Datos (AFYP)

API REST y esquema de base de datos relacional PostgreSQL para el **Sistema de Control de Paros y Ventanillas de Mantenimiento (SiCoPV)** en **TSR Saltillo**.
Microservicios para SpringBoot

## Despliegue Rápido con Docker

1. Clonar el repositorio:
```bash
git clone [https://github.com/](https://github.com/)<tu-usuario>/sicopv-backend.git
cd sicopv-backend

# SiCoPV / AFYP — Sistema de Control y Seguimiento de Mantenimiento 🚀

Aquí tienes la **descripción del proyecto basada directamente en la documentación de tu archivo** (`AFYP / SiCoPV - TSR Saltillo`), acompañada por el **desglose completo de herramientas y tecnologías** que estamos utilizando en toda la solución.

---

# 📋 AFYP — Atención hacia Fallas Futuras Y Presentes

### **Solución de Software:** SiCoPV (Sistema de Control de Paros y Ventanillas de Mantenimiento)

**Empresa Cliente:** TSR Saltillo (Sector Automotriz)

---

## 📌 Descripción General del Proyecto

El proyecto **AFYP** contempla el desarrollo de **SiCoPV**, un sistema de software diseñado para centralizar y agilizar el registro, seguimiento y atención de fallas en la maquinaria de planta de TSR Saltillo. Sustituye los registros verbales, hojas de papel y hojas de cálculo dispersas por una plataforma digital unificada que permite mejorar los tiempos de respuesta y construir una trazabilidad completa de los eventos de mantenimiento.

### **Componentes Funcionales Clave:**

1. **Lectura de Código QR:** Identificación rápida y precisa de cada equipo al momento de reportar una falla en línea de producción.


2. **Generación Automática de Folios:** Asignación de un identificador único (`FOL-XXXXXX`) a cada incidencia desde su apertura hasta su resolución formal.


3. **Alertas en Tiempo Real:** Notificaciones instantáneas al personal de mantenimiento al momento de registrarse un reporte para reducir los tiempos muertos.


4. **Bitácora Digital:** Registro centralizado de diagnósticos, causas raíz, tiempos de reparación y refacciones/piezas utilizadas.


5. **Métricas y Reportes PDF:** Cálculo automático de indicadores como el **MTTR (Mean Time To Repair)** y generación de respaldos formales en PDF para el cierre de incidencias.



---

## 🛠️ Herramientas y Stack Tecnológico (De todo a todo)

### **1. Backend (Arquitectura Monorepo Políglota & Event-Driven)**

* **Node.js + Express.js (`node-core-service`):**
* **Uso:** Servidor para API RESTful (CRUD de usuarios, equipos, fallas, bitácora y generación de folios).
* **Paquetes principales:**
* `express`: Framework para creación de rutas y servidor HTTP.
* `pg`: Cliente oficial de Node.js para conectar con PostgreSQL.
* `jsonwebtoken` (JWT): Autenticación y manejo de sesiones seguras.
* `bcryptjs`: Encriptación y cifrado de contraseñas de usuarios.
* `dotenv`: Manejo de variables de entorno seguras.
* `cors`: Configuración de accesos de origen cruzado para apps cliente.




* **Java 17 + Spring Boot 3 (`spring-realtime-service`):**
* **Uso:** Microservicio especializado en la transmisión de alertas de fallas en tiempo real a los técnicos de planta.
* **Módulos & Protocolos:**
* `Spring WebSocket`: Comunicación bidireccional cliente-servidor.
* `STOMP / SockJS`: Protocolo de mensajería orientada a objetos sobre WebSockets en el canal `/topic/alertas-mantenimiento`.
* `Maven`: Gestor de dependencias y empaquetado del microservicio (`pom.xml`).





---

### **2. Base de Datos y Persistencia**

* **PostgreSQL 15:**
* **Uso:** Base de datos relacional compartida para almacenar la información de usuarios, roles, catálogo de equipos, registros de fallas, bitácoras y refacciones.
* **Scripts de Inicialización:**
* `schema.sql`: Creación automatizada de las 8 tablas de la base de datos.
* `seed.sql`: Carga de datos iniciales de prueba y usuarios por defecto.





---

### **3. Infraestructura, Despliegue y Contenerización**

* **Docker:**
* **Uso:** Contenerización de cada servicio mediante `Dockerfile` independientes (`node-core-service`, `spring-realtime-service` y `postgres`).


* **Docker Compose:**
* **Uso:** Orquestación y levantamiento unificado de toda la solución mediante el archivo `docker-compose.yaml`.


* **Environment Variables (`.env`):**
* **Uso:** Aislamiento de credenciales (puertos, claves secretas JWT y contraseñas de base de datos).



---

### **4. Control de Versiones y Colaboración**

* **Git:**
* **Uso:** Control de versiones local y gestión de ramas.


* **GitHub (`GaboCoBa05/sicopv-backend`):**
* **Uso:** Repositorio central remoto para respaldo de código y colaboración en el proyecto.


* **GitHub Invitations:**
* **Uso:** Gestión de accesos y permisos para colaboradores del equipo.



---

### **5. Entorno de Desarrollo y Pruebas (Tooling)**

* **Visual Studio Code (VS Code):**
* **Uso:** IDE / Editor de código principal.
* **Extensiones utilizadas:** *Java Extension Pack*, *Docker*, *PostgreSQL*, *GitLens*, *Zip File Extension*.


* **PowerShell / Terminal Integrada:**
* **Uso:** Ejecución de comandos Git, automatización de scripts de creación de archivos (`New-Item`, `Set-Content`) y empaquetado (`Compress-Archive`).


* **Postman:**
* **Uso:** Pruebas y validación de endpoints de la API REST (`GET`, `POST`, `PUT`, `DELETE`).
---

## 🏛️ Arquitectura del Sistema

El backend combina la agilidad de Node.js para las operaciones transaccionales REST con la potencia de Spring Boot para la comunicación bidireccional mediante WebSockets.

```text
                                       +-----------------------------------+
                                       |          CLIENTES / APP           |
                                       +-----------------+-----------------+
                                                         |
                                 +-----------------------+-----------------------+
                                 |                                               |
                       REST API (HTTP)                                   WebSockets (WS)
                                 |                                               |
                                 v                                               v
            +------------------------------------+             +------------------------------------+
            |      node-core-service (Node.js)   |             |   spring-realtime-service (Java)   |
            |      "Core & Business Service"     |             |   "Notification & Realtime Service"|
            +-----------------+------------------+             +-----------------+------------------+
                              |                                                  |
                              | Registra Falla / CRUD                            | Transmite Alertas
                              v                                                  v
            +---------------------------------------------------------------------------------------+
            |                                 BASE DE DATOS COMPARTIDA                              |
            |                                    (PostgreSQL)                                       |
            +---------------------------------------------------------------------------------------+

Integrantes:
Axel Gabriel Coronado Ballesteros
Carlos Alberto Hernández Monsiváis
Andrés Valdés Romo
José uriel coronado Jaramillo
Roberto Julián nakasima martinez
