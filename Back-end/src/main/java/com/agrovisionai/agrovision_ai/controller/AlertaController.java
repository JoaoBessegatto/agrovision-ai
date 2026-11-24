package com.agrovisionai.agrovision_ai.controller;

import com.agrovisionai.agrovision_ai.domain.dto.response.CentralAlertasResponseDTO;
import com.agrovisionai.agrovision_ai.service.DesempenhoService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/alertas")
public class AlertaController {
    private final DesempenhoService desempenhoService;

    public AlertaController(DesempenhoService desempenhoService) {
        this.desempenhoService = desempenhoService;
    }

    @GetMapping("/fazenda/{fazendaId}")
    @PreAuthorize("isAuthenticated()")
    public CentralAlertasResponseDTO listar(@PathVariable UUID fazendaId) {
        return desempenhoService.buscarAlertasPorFazenda(fazendaId);
    }
}
