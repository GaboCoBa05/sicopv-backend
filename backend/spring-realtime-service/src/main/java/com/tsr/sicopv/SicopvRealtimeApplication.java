package com.tsr.sicopv;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Punto de entrada principal para el microservicio de eventos y notificaciones en tiempo real SiCoPV.
 * Responsabilidad Única (SRP): Inicialización y arranque del contexto de la aplicación Spring Boot.
 */
@SpringBootApplication
public class SicopvRealtimeApplication {

    public static void main(String[] args) {
        SpringApplication.run(SicopvRealtimeApplication.class, args);
    }
}

