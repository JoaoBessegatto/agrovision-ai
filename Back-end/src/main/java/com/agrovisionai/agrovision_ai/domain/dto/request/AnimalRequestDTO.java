package com.agrovisionai.agrovision_ai.domain.dto.request;

import com.agrovisionai.agrovision_ai.domain.enums.SexoAnimal;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;
import java.util.UUID;

public record AnimalRequestDTO(

        @NotBlank(message = "Identificação é obrigatória")
        String identificacao,

        @NotBlank(message = "Raça é obrigatória")
        String raca,

        @NotNull(message = "Sexo é obrigatório")
        SexoAnimal sexo,

        @NotNull(message = "Data de nascimento é obrigatória")
        LocalDate dataNascimento,

        @NotNull(message = "Rebanho é obrigatório")
        UUID rebanhoId,

        @NotNull(message = "Peso atual é obrigatório")
        @Positive(message = "Peso deve ser maior que zero")
        Double pesoAtual

) {}