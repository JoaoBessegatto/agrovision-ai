package com.agrovisionai.agrovision_ai.domain.dto.request;

import com.agrovisionai.agrovision_ai.domain.enums.CargoFuncionario;

import java.util.UUID;

public record FuncionarioRequestDTO(
        UUID usuarioId,
        UUID fazendaId,
        CargoFuncionario cargo
){}
