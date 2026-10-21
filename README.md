# SiCoPV — Backend & Base de Datos (AFYP)

API REST y esquema de base de datos relacional PostgreSQL para el **Sistema de Control de Paros y Ventanillas de Mantenimiento (SiCoPV)** en **TSR Saltillo**.
Microservicios para SpringBoot

## Despliegue Rápido con Docker

1. Clonar el repositorio:
```bash
git clone [https://github.com/](https://github.com/)<tu-usuario>/sicopv-backend.git
cd sicopv-backend

# SiCoPV / AFYP — Sistema de Control y Seguimiento de Mantenimiento 🚀

 📌 Descripción General
**SiCoPV / AFYP** es una plataforma backend para la gestión, monitoreo y atención de mantenimientos en planta (**TSR Saltillo**). El sistema está diseñado para digitalizar el reporte de incidencias en maquinaria mediante códigos QR, optimizar la asignación de técnicos de mantenimiento, registrar bitácoras de reparación y calcular métricas operativas como el **MTTR (Mean Time To Repair)**.

Para cumplir con los requerimientos de alta disponibilidad, baja latencia y alertas instantáneas en la línea de producción, la infraestructura backend adopta una **Arquitectura de Microservicios Políglota y Event-Driven**, organizada bajo un esquema de **Monorepo** y orquestada completamente mediante **Docker**.

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
