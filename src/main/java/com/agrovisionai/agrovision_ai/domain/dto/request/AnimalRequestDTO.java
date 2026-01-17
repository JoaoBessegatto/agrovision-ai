package com.agrovisionai.agrovision_ai.domain.dto.request;

import com.agrovisionai.agrovision_ai.domain.enums.SexoAnimal;

import java.time.LocalDate;
import java.util.UUID;

public record AnimalRequestDTO(
        String identificacao,
        String raca,
        SexoAnimal sexo,
        LocalDate dataNascimento,
        UUID rebanhoId
) {}
