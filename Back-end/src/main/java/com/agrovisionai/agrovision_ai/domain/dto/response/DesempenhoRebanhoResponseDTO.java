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
        Double pesoProjetado30DiasKg,
        Double pesoProjetado60DiasKg,
        Double pesoProjetado90DiasKg,
        Double melhorGmdKgDia,
        Double piorGmdKgDia,
        long animaisEmPerda,
        long animaisComGmdBaixo,
        long animaisSemPesagemRecente
) {
}
