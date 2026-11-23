package com.agrovisionai.agrovision_ai.domain.dto.response;

import com.agrovisionai.agrovision_ai.domain.dto.request.GeoJsonPolygonDTO;
import com.agrovisionai.agrovision_ai.domain.enums.TipoAreaManejo;

import java.time.LocalDateTime;
import java.util.UUID;

public record AreaManejoResponseDTO(
        UUID id,
        UUID fazendaId,
        String nome,
        String descricao,
        TipoAreaManejo tipo,
        GeoJsonPolygonDTO geometry,
        Double areaCalculadaHa,
        UUID rebanhoId,
        String rebanhoNome,
        IndicadoresAreaManejoDTO indicadores,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {
}
