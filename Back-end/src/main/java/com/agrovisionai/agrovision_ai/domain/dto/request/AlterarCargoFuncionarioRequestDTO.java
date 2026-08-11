package com.agrovisionai.agrovision_ai.domain.dto.request;

import com.agrovisionai.agrovision_ai.domain.enums.CargoFuncionario;
import jakarta.validation.constraints.NotNull;

public record AlterarCargoFuncionarioRequestDTO(

        @NotNull
        CargoFuncionario cargo

) {
}