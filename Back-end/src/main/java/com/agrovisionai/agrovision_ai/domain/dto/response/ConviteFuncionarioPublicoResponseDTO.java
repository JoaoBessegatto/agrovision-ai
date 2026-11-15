package com.agrovisionai.agrovision_ai.domain.dto.response;

import com.agrovisionai.agrovision_ai.domain.entity.ConviteFuncionario;

import java.time.LocalDateTime;

public record ConviteFuncionarioPublicoResponseDTO(
        String email,
        String nomeFazenda,
        String cargo,
        LocalDateTime expiraEm,
        boolean usuarioExistente
) {

    public static ConviteFuncionarioPublicoResponseDTO from(
            ConviteFuncionario convite,
            boolean usuarioExistente
    ) {
        return new ConviteFuncionarioPublicoResponseDTO(
                convite.getEmail(),
                convite.getFazenda().getNome(),
                convite.getCargo().name(),
                convite.getExpiraEm(),
                usuarioExistente
        );
    }
}
