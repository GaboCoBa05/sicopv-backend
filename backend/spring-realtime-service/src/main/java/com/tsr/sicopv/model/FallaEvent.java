package com.tsr.sicopv.model;

import java.io.Serializable;
import java.util.Objects;

/**
 * Data Transfer Object (DTO) para la transmisión de eventos de fallas en tiempo real.
 * Responsabilidad Única (SRP): Representación y encapsulamiento del estado de una falla de equipo.
 */
public class FallaEvent implements Serializable {

    private static final long serialVersionUID = 1L;

    private String folioIncidencia;
    private String equipoNombre;
    private String ubicacion;
    private String tipoFalla;
    private String prioridad;
    private String timestamp;

    public FallaEvent() {
    }

    public FallaEvent(String folioIncidencia, String equipoNombre, String ubicacion,
                      String tipoFalla, String prioridad, String timestamp) {
        this.folioIncidencia = folioIncidencia;
        this.equipoNombre = equipoNombre;
        this.ubicacion = ubicacion;
        this.tipoFalla = tipoFalla;
        this.prioridad = prioridad;
        this.timestamp = timestamp;
    }

    public String getFolioIncidencia() {
        return folioIncidencia;
    }

    public void setFolioIncidencia(String folioIncidencia) {
        this.folioIncidencia = folioIncidencia;
    }

    public String getEquipoNombre() {
        return equipoNombre;
    }

    public void setEquipoNombre(String equipoNombre) {
        this.equipoNombre = equipoNombre;
    }

    public String getUbicacion() {
        return ubicacion;
    }

    public void setUbicacion(String ubicacion) {
        this.ubicacion = ubicacion;
    }

    public String getTipoFalla() {
        return tipoFalla;
    }

    public void setTipoFalla(String tipoFalla) {
        this.tipoFalla = tipoFalla;
    }

    public String getPrioridad() {
        return prioridad;
    }

    public void setPrioridad(String prioridad) {
        this.prioridad = prioridad;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        FallaEvent that = (FallaEvent) o;
        return Objects.equals(folioIncidencia, that.folioIncidencia) &&
                Objects.equals(equipoNombre, that.equipoNombre) &&
                Objects.equals(ubicacion, that.ubicacion) &&
                Objects.equals(tipoFalla, that.tipoFalla) &&
                Objects.equals(prioridad, that.prioridad) &&
                Objects.equals(timestamp, that.timestamp);
    }

    @Override
    public int hashCode() {
        return Objects.hash(folioIncidencia, equipoNombre, ubicacion, tipoFalla, prioridad, timestamp);
    }

    @Override
    public String toString() {
        return "FallaEvent{" +
                "folioIncidencia='" + folioIncidencia + '\'' +
                ", equipoNombre='" + equipoNombre + '\'' +
                ", ubicacion='" + ubicacion + '\'' +
                ", tipoFalla='" + tipoFalla + '\'' +
                ", prioridad='" + prioridad + '\'' +
                ", timestamp='" + timestamp + '\'' +
                '}';
    }
}

