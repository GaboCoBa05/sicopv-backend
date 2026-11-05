# ===================================================================
# ETAPA 1: Construcción y Empaquetado (Maven Builder)
# ===================================================================
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder

WORKDIR /build

# Copia del archivo pom.xml para aprovechar la caché de dependencias
COPY pom.xml .

# Descarga anticipada de dependencias
RUN mvn dependency:go-offline -B

# Copia del árbol de código fuente
COPY src ./src

# Empaquetado del microservicio omitiendo pruebas en compilación de imagen
RUN mvn clean package -DskipTests

# ===================================================================
# ETAPA 2: Entorno de Ejecución Ligero (Runtime JRE Alpine)
# ===================================================================
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Creación de usuario y grupo de sistema sin privilegios para seguridad en contenedor
RUN addgroup -S sicopv && adduser -S sicopv -G sicopv

# Copia del artefacto JAR generado desde la etapa de compilación
COPY --from=builder /build/target/spring-realtime-service-*.jar app.jar

# Asignación de propiedad al usuario sin privilegios
RUN chown -R sicopv:sicopv /app

# Cambio al usuario no-root
USER sicopv

# Exposición del puerto HTTP / WebSocket de Spring Boot
EXPOSE 8080

# Opciones de memoria JVM adaptadas para contenedores
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

# Ejecución de la aplicación Spring Boot
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

