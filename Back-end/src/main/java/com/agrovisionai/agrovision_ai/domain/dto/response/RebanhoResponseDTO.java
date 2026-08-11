package com.agrovisionai.agrovision_ai.domain.dto.response;

import com.agrovisionai.agrovision_ai.domain.entity.Rebanho;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record RebanhoResponseDTO(
        UUID id,
        String nome,
        String descricao,
        UUID fazendaId,
        Integer quantidadeAnimais
)
{
    public static RebanhoResponseDTO from(Rebanho rebanho) {
        return new RebanhoResponseDTO(
                rebanho.getId(),
                rebanho.getNome(),
                rebanho.getDescricao(),
                rebanho.getFazenda().getId(),
                rebanho.getAnimais() == null
                        ? 0
                        : rebanho.getAnimais().size()
        );
    }
}
