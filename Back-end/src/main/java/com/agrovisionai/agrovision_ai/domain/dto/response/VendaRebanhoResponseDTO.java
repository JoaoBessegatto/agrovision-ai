package com.agrovisionai.agrovision_ai.domain.dto.response;

import java.util.UUID;

public record VendaRebanhoResponseDTO(

        UUID rebanhoId,

        String rebanhoNome,

        int totalAnimais,

        int animaisVendidos,

        int jaVendidos,

        int mortosIgnorados

) {}