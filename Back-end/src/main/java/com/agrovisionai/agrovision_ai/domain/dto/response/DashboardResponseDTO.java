package com.agrovisionai.agrovision_ai.domain.dto.response;

import java.time.LocalDateTime;

public record DashboardResponseDTO(
        long totalAnimais,
        long animaisAtivos,
        long animaisInativos,
        long totalRebanhos,
        long totalFuncionario,
        double pesoMedio,
        LocalDateTime ultimaPesagem
) {
}
