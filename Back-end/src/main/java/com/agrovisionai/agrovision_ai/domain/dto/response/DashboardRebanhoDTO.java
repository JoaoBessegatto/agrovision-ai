package com.agrovisionai.agrovision_ai.domain.dto.response;
import java.util.UUID;

public record DashboardRebanhoDTO(

        UUID rebanhoId,

        String nome,

        long quantidadeAnimais,

        long animaisAtivos,

        double pesoMedio

) {}