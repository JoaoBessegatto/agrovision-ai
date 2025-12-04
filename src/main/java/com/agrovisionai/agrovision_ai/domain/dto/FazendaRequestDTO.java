package com.agrovisionai.agrovision_ai.domain.dto;


public record FazendaRequestDTO(
        String id,
        String nome,
        String cidade,
        String estado,
        Double latitude,
        Double longitude,
        Double areaTotalHa,
        String exploracao,
        String geopoligono
) {

}
