package com.agrovisionai.agrovision_ai.domain.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record RegistroPesoRequestDTO(

        @NotNull(message = "O peso é obrigatório.")
        @Positive(message = "O peso deve ser maior que zero.")
        Double pesoKg

) {
}