package com.agrovisionai.agrovision_ai.controller;

import com.agrovisionai.agrovision_ai.domain.dto.request.AreaManejoRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.request.AssociarRebanhoAreaRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.AreaManejoResponseDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.ResumoAreasManejoResponseDTO;
import com.agrovisionai.agrovision_ai.service.AreaManejoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/areas-manejo")
public class AreaManejoController {

    private final AreaManejoService areaManejoService;

    public AreaManejoController(
            AreaManejoService areaManejoService
    ) {
        this.areaManejoService =
                areaManejoService;
    }

    @PostMapping("/fazenda/{fazendaId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AreaManejoResponseDTO> cadastrar(
            @PathVariable UUID fazendaId,
            @RequestBody @Valid AreaManejoRequestDTO dto
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        areaManejoService.cadastrar(
                                fazendaId,
                                dto
                        )
                );
    }

    @GetMapping("/fazenda/{fazendaId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResumoAreasManejoResponseDTO> listarResumo(
            @PathVariable UUID fazendaId
    ) {

        return ResponseEntity.ok(
                areaManejoService.listarResumo(
                        fazendaId
                )
        );
    }

    @GetMapping("/{areaId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AreaManejoResponseDTO> buscarPorId(
            @PathVariable UUID areaId
    ) {

        return ResponseEntity.ok(
                areaManejoService.buscarPorId(
                        areaId
                )
        );
    }

    @PutMapping("/{areaId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AreaManejoResponseDTO> atualizar(
            @PathVariable UUID areaId,
            @RequestBody @Valid AreaManejoRequestDTO dto
    ) {

        return ResponseEntity.ok(
                areaManejoService.atualizar(
                        areaId,
                        dto
                )
        );
    }

    @PatchMapping("/{areaId}/rebanho")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AreaManejoResponseDTO> associarRebanho(
            @PathVariable UUID areaId,
            @RequestBody AssociarRebanhoAreaRequestDTO dto
    ) {

        return ResponseEntity.ok(
                areaManejoService.associarRebanho(
                        areaId,
                        dto
                )
        );
    }

    @DeleteMapping("/{areaId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deletar(
            @PathVariable UUID areaId
    ) {

        areaManejoService.deletar(
                areaId
        );

        return ResponseEntity
                .noContent()
                .build();
    }
}
