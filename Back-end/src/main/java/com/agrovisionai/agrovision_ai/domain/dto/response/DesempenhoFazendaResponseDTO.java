package com.agrovisionai.agrovision_ai.domain.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record DesempenhoFazendaResponseDTO(
        UUID fazendaId,
        long animaisAtivos,
        long animaisComGmd,
        long animaisSemDados,
        long animaisEmGanho,
        long animaisEstaveis,
        long animaisEmPerda,
        Double gmdMedioKgDia,
        Double pesoMedioAtualKg,
        Double pesoProjetado30DiasKg,
        Double pesoProjetado60DiasKg,
        Double pesoProjetado90DiasKg,
        double coberturaGmdPercentual,
        int totalAlertas,
        int alertasCriticos,
        Double gmdMinimoAlertaKgDia,
        int diasSemPesagemAlerta,
        int projecaoDias,
        LocalDateTime calculadoEm,
        List<DesempenhoRebanhoResponseDTO> rebanhos,
        List<DesempenhoAnimalResponseDTO> rankingMelhores,
        List<DesempenhoAnimalResponseDTO> rankingAtencao,
        List<AlertaDesempenhoResponseDTO> alertas
) {
}
