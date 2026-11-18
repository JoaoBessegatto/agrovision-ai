package com.agrovisionai.agrovision_ai.domain.dto.response;

import com.agrovisionai.agrovision_ai.domain.entity.AreaManejo;
import com.agrovisionai.agrovision_ai.domain.entity.Rebanho;
import com.agrovisionai.agrovision_ai.domain.enums.TipoAreaManejo;

import java.util.UUID;

public record RebanhoResponseDTO(
        UUID id,
        String nome,
        String descricao,
        UUID fazendaId,
        Integer quantidadeAnimais,
        UUID areaManejoId,
        String areaManejoNome,
        TipoAreaManejo areaManejoTipo
)
{
    public static RebanhoResponseDTO from(
            Rebanho rebanho
    ) {

        AreaManejo area =
                rebanho.getAreaManejoAtual();

        return new RebanhoResponseDTO(
                rebanho.getId(),
                rebanho.getNome(),
                rebanho.getDescricao(),
                rebanho.getFazenda().getId(),
                rebanho.getAnimais() == null
                        ? 0
                        : rebanho.getAnimais().size(),
                area == null
                        ? null
                        : area.getId(),
                area == null
                        ? null
                        : area.getNome(),
                area == null
                        ? null
                        : area.getTipo()
        );
    }
}
