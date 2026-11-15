package com.agrovisionai.agrovision_ai.domain.dto.response;

import com.agrovisionai.agrovision_ai.domain.entity.ConviteFuncionario;

import java.time.LocalDateTime;
import java.util.UUID;

public record ConviteFuncionarioResponseDTO(
        UUID id,
        String email,
        UUID fazendaId,
        String nomeFazenda,
        String cargo,
        String status,
        LocalDateTime criadoEm,
        LocalDateTime expiraEm,
        LocalDateTime aceitoEm
) {

    public static ConviteFuncionarioResponseDTO from(ConviteFuncionario convite) {
        return new ConviteFuncionarioResponseDTO(
                convite.getId(),
                convite.getEmail(),
                convite.getFazenda().getId(),
                convite.getFazenda().getNome(),
                convite.getCargo().name(),
                convite.getStatusEfetivo().name(),
                convite.getCriadoEm(),
                convite.getExpiraEm(),
                convite.getAceitoEm()
        );
    }
}
