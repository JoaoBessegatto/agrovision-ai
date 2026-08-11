package com.agrovisionai.agrovision_ai.domain.dto.response;

import com.agrovisionai.agrovision_ai.domain.entity.Funcionario;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record FuncionarioResponseDTO(
        String nomeUsuario,
        String email,

        UUID fazendaId,
        String nomeFazenda,

        String cargo,
        boolean ativo,
        LocalDateTime dataVinculo
) {
    public static FuncionarioResponseDTO from(Funcionario funcionario){
        return new FuncionarioResponseDTO(
                funcionario.getUsuario().getName(),
                funcionario.getUsuario().getEmail(),
                funcionario.getFazenda().getId(),
                funcionario.getFazenda().getNome(),
                funcionario.getCargo().name(),
                funcionario.isAtivo(),
                funcionario.getDataVinculo()
        );
    }
}
