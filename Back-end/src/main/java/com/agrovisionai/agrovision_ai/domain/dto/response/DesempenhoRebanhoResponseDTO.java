package com.agrovisionai.agrovision_ai.domain.dto.response;

import java.util.UUID;

public record DesempenhoRebanhoResponseDTO(
        UUID rebanhoId,
        String nome,
        long animaisAtivos,
        long animaisComGmd,
        double coberturaGmdPercentual,
        Double pesoMedioAtualKg,
        Double gmdMedioKgDia,
        Double melhorGmdKgDia,
        Double piorGmdKgDia,
        long animaisEmPerda,
        long animaisComGmdBaixo,
        long animaisSemPesagemRecente
) {
}
