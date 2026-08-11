package com.agrovisionai.agrovision_ai.domain.dto.response;

import com.agrovisionai.agrovision_ai.domain.entity.RegistroPeso;

import java.time.LocalDateTime;
import java.util.UUID;

public record RegistroPesoResponseDTO(

        UUID id,

        UUID animalId,

        String identificacaoAnimal,

        Double pesoKg,

        LocalDateTime dataRegistro,

        UUID usuarioId,

        String usuario

) {

    public static RegistroPesoResponseDTO from(RegistroPeso registro) {

        return new RegistroPesoResponseDTO(

                registro.getId(),

                registro.getAnimal().getId(),

                registro.getAnimal().getIdentificacao(),

                registro.getPesoKg(),

                registro.getDataRegistro(),

                registro.getUsuarioResponsavel().getId(),

                registro.getUsuarioResponsavel()
                        .getName()

        );
    }
}