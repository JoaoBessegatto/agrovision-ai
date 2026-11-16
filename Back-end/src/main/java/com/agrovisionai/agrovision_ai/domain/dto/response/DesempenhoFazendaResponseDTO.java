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
