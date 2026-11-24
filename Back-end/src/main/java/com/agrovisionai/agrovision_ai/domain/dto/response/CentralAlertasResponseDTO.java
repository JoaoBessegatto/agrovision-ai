package com.agrovisionai.agrovision_ai.domain.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record CentralAlertasResponseDTO(
        UUID fazendaId,
        int animaisAtivos,
        LocalDateTime calculadoEm,
        double gmdMinimoAlertaKgDia,
        int diasSemPesagemAlerta,
        List<AlertaDesempenhoResponseDTO> alertas
) {}
