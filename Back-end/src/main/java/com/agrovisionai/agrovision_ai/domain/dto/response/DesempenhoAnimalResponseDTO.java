package com.agrovisionai.agrovision_ai.domain.dto.response;

import com.agrovisionai.agrovision_ai.domain.enums.TendenciaDesempenho;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record DesempenhoAnimalResponseDTO(
        UUID animalId,
        String identificacao,
        UUID rebanhoId,
        String rebanhoNome,
        Double pesoAtualKg,
        Double pesoAnteriorKg,
        LocalDateTime dataPesoAtual,
        LocalDateTime dataPesoAnterior,
        Double ganhoPesoKg,
        Double intervaloDias,
        Double gmdKgDia,
        TendenciaDesempenho tendencia,
        Double projecaoPesoKg,
        int projecaoDias,
        Long diasSemPesagem,
        boolean dadosSuficientes,
        List<AlertaDesempenhoResponseDTO> alertas
) {
}
