package com.agrovisionai.agrovision_ai.domain.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record GeoJsonPolygonDTO(
        @NotBlank String type,
        @NotEmpty List<List<List<Double>>> coordinates
) {
}
