package com.agrovisionai.agrovision_ai.domain.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CadastroFuncionarioPorConviteRequestDTO(
        @NotBlank
        String token,

        @NotBlank
        @Size(min = 2, max = 120)
        String name,

        @NotBlank
        @Size(min = 6, max = 100)
        String password
) {
}
