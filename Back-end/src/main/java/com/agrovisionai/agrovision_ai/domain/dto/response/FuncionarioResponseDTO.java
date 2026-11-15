package com.agrovisionai.agrovision_ai.domain.dto.response;

import com.agrovisionai.agrovision_ai.domain.entity.Funcionario;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record FuncionarioResponseDTO(
        UUID id,
        UUID usuarioId,
        String nomeUsuario,
        String email,
        UUID fazendaId,
        String nomeFazenda,
        String cargo,
        List<String> permissoes,
        boolean ativo,
        LocalDateTime dataVinculo
) {

    public static FuncionarioResponseDTO from(Funcionario funcionario) {
        return new FuncionarioResponseDTO(
                funcionario.getId(),
                funcionario.getUsuario().getId(),
                funcionario.getUsuario().getName(),
                funcionario.getUsuario().getEmail(),
                funcionario.getFazenda().getId(),
                funcionario.getFazenda().getNome(),
                funcionario.getCargo().name(),
                funcionario.getCargo()
                        .getPermissoes()
                        .stream()
                        .map(Enum::name)
                        .sorted()
                        .toList(),
                funcionario.isAtivo(),
                funcionario.getDataVinculo()
        );
    }
}
