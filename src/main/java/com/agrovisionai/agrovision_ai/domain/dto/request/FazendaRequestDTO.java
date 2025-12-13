package com.agrovisionai.agrovision_ai.domain.dto.request;


import java.util.UUID;

public record FazendaRequestDTO(
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

}
