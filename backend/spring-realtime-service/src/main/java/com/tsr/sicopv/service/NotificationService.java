package com.tsr.sicopv.service;

import com.tsr.sicopv.model.FallaEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Set;
import java.util.UUID;

/**
 * Servicio de procesamiento y enriquecimiento de alertas de falla.
 * Responsabilidad Única (SRP): Aplicar la lógica de negocio sobre las alertas (validación de prioridad,
 * enriquecimiento de metadatos y auditoría) de manera desacoplada del protocolo de transporte.
 */
@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private static final Set<String> PRIORIDADES_VALIDAS = Set.of("BAJA", "MEDIA", "ALTA", "CRITICA", "CRÍTICA");
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    /**
     * Procesa, valida y enriquece la información del evento de falla antes de su emisión.
     *
     * @param evento Evento de falla recibido desde el cliente STOMP.
     * @return Evento de falla validado, normalizado y enriquecido con folio y timestamp.
     */
    public FallaEvent processAndEnrich(FallaEvent evento) {
        if (evento == null) {
            throw new IllegalArgumentException("El evento de falla no puede ser nulo");
        }

        // 1. Validación y normalización de la prioridad
        String prioridadNormalizada = normalizarPrioridad(evento.getPrioridad());
        evento.setPrioridad(prioridadNormalizada);

        // 2. Generación o aseguramiento del folio único de incidencia
        if (evento.getFolioIncidencia() == null || evento.getFolioIncidencia().isBlank()) {
            String folioGenerado = "INC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            evento.setFolioIncidencia(folioGenerado);
        }

        // 3. Normalización de campos descriptivos
        if (evento.getEquipoNombre() == null || evento.getEquipoNombre().isBlank()) {
            evento.setEquipoNombre("EQUIPO-NO-ESPECIFICADO");
        }
        if (evento.getUbicacion() == null || evento.getUbicacion().isBlank()) {
            evento.setUbicacion("PLANTA-GENERAL");
        }
        if (evento.getTipoFalla() == null || evento.getTipoFalla().isBlank()) {
            evento.setTipoFalla("GENERAL");
        }

        // 4. Enriquecimiento de marca de tiempo (timestamp)
        if (evento.getTimestamp() == null || evento.getTimestamp().isBlank()) {
            evento.setTimestamp(LocalDateTime.now().format(FORMATTER));
        }

        // 5. Registro de log de auditoría
        log.info("[AUDITORIA_FALLA] Folio: {} | Equipo: {} | Ubicacion: {} | Tipo: {} | Prioridad: {} | Timestamp: {}",
                evento.getFolioIncidencia(),
                evento.getEquipoNombre(),
                evento.getUbicacion(),
                evento.getTipoFalla(),
                evento.getPrioridad(),
                evento.getTimestamp());

        return evento;
    }

    private String normalizarPrioridad(String prioridadRaw) {
        if (prioridadRaw == null || prioridadRaw.isBlank()) {
            log.warn("Prioridad no proporcionada. Asignando valor por defecto 'MEDIA'.");
            return "MEDIA";
        }

        String limpia = prioridadRaw.trim().toUpperCase();
        if ("CRÍTICA".equals(limpia)) {
            return "CRITICA";
        }

        if (PRIORIDADES_VALIDAS.contains(limpia)) {
            return limpia;
        }

        log.warn("Prioridad '{}' no reconocida. Ajustando a valor seguro 'MEDIA'.", prioridadRaw);
        return "MEDIA";
    }
}

