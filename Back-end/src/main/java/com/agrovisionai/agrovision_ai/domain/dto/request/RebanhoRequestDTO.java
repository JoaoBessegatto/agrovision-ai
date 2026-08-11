package com.agrovisionai.agrovision_ai.domain.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record RebanhoRequestDTO(
        @NotBlank
        String nome,

        String descricao,

        @NotNull
        UUID fazendaId
) {
}
