package com.agrovisionai.agrovision_ai.domain.dto.response;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import com.agrovisionai.agrovision_ai.domain.dto.response.DashboardRebanhoDTO;

public record DashboardResponseDTO(

        UUID fazendaId,

        long totalAnimais,

        long animaisAtivos,

        long animaisInativos,

        long animaisVendidos,

        long animaisMortos,

        long totalRebanhos,

        long totalPesagens,

        double pesoMedioAtual,

        LocalDateTime ultimaPesagem,

        List<DashboardRebanhoDTO> rebanhos,

        List<DashboardEvolucaoPesoDTO> evolucaoPeso

) {}