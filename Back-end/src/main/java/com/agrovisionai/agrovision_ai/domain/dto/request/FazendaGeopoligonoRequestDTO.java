package com.agrovisionai.agrovision_ai.domain.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record FazendaGeopoligonoRequestDTO(
        @NotNull @Valid GeoJsonPolygonDTO geometry
) {
}
