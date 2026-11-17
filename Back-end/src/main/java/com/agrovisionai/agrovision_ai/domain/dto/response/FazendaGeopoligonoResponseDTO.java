package com.agrovisionai.agrovision_ai.domain.dto.response;

import com.agrovisionai.agrovision_ai.domain.dto.request.GeoJsonPolygonDTO;

import java.time.LocalDateTime;
import java.util.UUID;

public record FazendaGeopoligonoResponseDTO(
        UUID fazendaId,
        boolean configurado,
        GeoJsonPolygonDTO geometry,
        Double areaCalculadaHa,
        Double areaInformadaHa,
        Double diferencaAreaHa,
        Double diferencaPercentual,
        Double centroideLatitude,
        Double centroideLongitude,
        LocalDateTime atualizadoEm
) {
}
