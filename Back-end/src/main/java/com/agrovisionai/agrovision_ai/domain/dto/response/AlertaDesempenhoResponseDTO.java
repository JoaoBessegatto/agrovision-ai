package com.agrovisionai.agrovision_ai.domain.dto.response;

import com.agrovisionai.agrovision_ai.domain.enums.SeveridadeAlertaDesempenho;
import com.agrovisionai.agrovision_ai.domain.enums.TipoAlertaDesempenho;

import java.util.UUID;

public record AlertaDesempenhoResponseDTO(
        TipoAlertaDesempenho tipo,
        SeveridadeAlertaDesempenho severidade,
        String titulo,
        String mensagem,
        UUID animalId,
        String identificacaoAnimal,
        UUID rebanhoId,
        String rebanhoNome
) {
}
