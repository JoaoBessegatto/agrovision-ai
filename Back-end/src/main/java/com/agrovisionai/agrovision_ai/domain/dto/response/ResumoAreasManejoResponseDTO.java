package com.agrovisionai.agrovision_ai.domain.dto.response;

import java.util.List;
import java.util.UUID;

public record ResumoAreasManejoResponseDTO(
        UUID fazendaId,
        Double areaFazendaDelimitadaHa,
        Double areaMapeadaHa,
        Double areaLivreHa,
        Double percentualAreaMapeada,
        long totalAreas,
        long totalPastos,
        long totalConfinamentos,
        Double areaPastoHa,
        Double areaConfinamentoHa,
        long rebanhosAssociados,
        long rebanhosSemArea,
        long animaisAtivosEmAreas,
        List<AreaManejoResponseDTO> areas
) {
}
