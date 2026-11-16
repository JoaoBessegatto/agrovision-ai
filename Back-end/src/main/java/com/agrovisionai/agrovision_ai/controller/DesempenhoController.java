package com.agrovisionai.agrovision_ai.controller;

import com.agrovisionai.agrovision_ai.domain.dto.response.DesempenhoAnimalResponseDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.DesempenhoFazendaResponseDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.DesempenhoRebanhoResponseDTO;
import com.agrovisionai.agrovision_ai.service.DesempenhoService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/desempenho")
public class DesempenhoController {

    private final DesempenhoService desempenhoService;

    public DesempenhoController(
            DesempenhoService desempenhoService
    ) {
        this.desempenhoService = desempenhoService;
    }

    @GetMapping("/fazenda/{fazendaId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DesempenhoFazendaResponseDTO> buscarPorFazenda(
            @PathVariable UUID fazendaId
    ) {
        return ResponseEntity.ok(
                desempenhoService.buscarPorFazenda(
                        fazendaId
                )
        );
    }

    @GetMapping("/rebanho/{rebanhoId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DesempenhoRebanhoResponseDTO> buscarPorRebanho(
            @PathVariable UUID rebanhoId
    ) {
        return ResponseEntity.ok(
                desempenhoService.buscarPorRebanho(
                        rebanhoId
                )
        );
    }

    @GetMapping("/animal/{animalId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DesempenhoAnimalResponseDTO> buscarPorAnimal(
            @PathVariable UUID animalId
    ) {
        return ResponseEntity.ok(
                desempenhoService.buscarPorAnimal(
                        animalId
                )
        );
    }
}
