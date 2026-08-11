package com.agrovisionai.agrovision_ai.domain.dto.response;

import com.agrovisionai.agrovision_ai.domain.entity.Fazenda;

import java.util.UUID;

public record FazendaResponseDTO(
        UUID id,
        String nome,
        String cidade,
        String estado,
        Double latitude,
        Double longitude,
        Double areaTotalHa,
        String exploracao,
        String geopoligono
) {

    public FazendaResponseDTO(Fazenda fazenda) {
        this(
                fazenda.getId(),
                fazenda.getNome(),
                fazenda.getCidade(),
                fazenda.getEstado(),
                fazenda.getLatitude(),
                fazenda.getLongitude(),
                fazenda.getAreaTotalHa(),
                fazenda.getExploracao().name(),
                fazenda.getGeopoligono()
        );
    }
}