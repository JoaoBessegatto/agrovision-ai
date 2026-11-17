package com.agrovisionai.agrovision_ai.domain.dto.response;

import com.agrovisionai.agrovision_ai.domain.enums.StatusCapacidadeConfinamento;

public record IndicadoresAreaManejoDTO(
        long animaisAtivos,
        Double pesoVivoTotalKg,
        Double pesoMedioKg,
        Double unidadesAnimais,
        Double cabecasPorHa,
        Double uaPorHa,
        Double pesoVivoPorHaKg,
        Double metrosQuadradosPorCabeca,
        Integer capacidadeMaximaCabecas,
        Double ocupacaoPercentual,
        Integer vagasDisponiveis,
        Integer excedenteCabecas,
        StatusCapacidadeConfinamento statusConfinamento
) {
}
