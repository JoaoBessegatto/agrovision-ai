package com.agrovisionai.agrovision_ai.domain.dto.request;

import com.agrovisionai.agrovision_ai.domain.enums.TipoAreaManejo;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.UUID;

public record AreaManejoRequestDTO(
        @NotBlank String nome,
        String descricao,
        @NotNull TipoAreaManejo tipo,
        @NotNull @Valid GeoJsonPolygonDTO geometry,
        @Positive Integer capacidadeMaximaCabecas,
        UUID rebanhoId
) {
}
