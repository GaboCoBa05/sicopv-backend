package com.tsr.sicopv.controller;

import com.tsr.sicopv.model.FallaEvent;
import com.tsr.sicopv.service.NotificationService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

/**
 * Controlador de transporte STOMP para la mensajería en tiempo real.
 * Responsabilidad Única (SRP): Recepción exclusiva de mensajes en el canal STOMP, delegación del procesamiento
 * al servicio de negocio y enrutamiento hacia el broker de difusión.
 */
@Controller
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * Endpoint STOMP para recibir reportes de fallas desde los clientes web.
     * Mapeado al destino de aplicación '/app/reportar-falla'.
     * Retransmite el evento validado y enriquecido a '/topic/alertas-mantenimiento'.
     *
     * @param fallaEvent Carga útil recibida en el mensaje STOMP.
     * @return Evento de falla procesado por el servicio de negocio.
     */
    @MessageMapping("/reportar-falla")
    @SendTo("/topic/alertas-mantenimiento")
    public FallaEvent handleReportarFalla(@Payload FallaEvent fallaEvent) {
        return notificationService.processAndEnrich(fallaEvent);
    }
}

