package com.agrovisionai.agrovision_ai.controller;

import com.agrovisionai.agrovision_ai.domain.dto.request.FazendaGeopoligonoRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.FazendaGeopoligonoResponseDTO;
import com.agrovisionai.agrovision_ai.service.FazendaGeopoligonoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/fazenda")
public class FazendaGeopoligonoController {

    private final FazendaGeopoligonoService geopoligonoService;

    public FazendaGeopoligonoController(
            FazendaGeopoligonoService geopoligonoService
    ) {
        this.geopoligonoService =
                geopoligonoService;
    }

    @GetMapping("/{fazendaId}/geopoligono")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<FazendaGeopoligonoResponseDTO> buscar(
            @PathVariable UUID fazendaId
    ) {

        return ResponseEntity.ok(
                geopoligonoService.buscar(
                        fazendaId
                )
        );
    }

    @PutMapping("/{fazendaId}/geopoligono")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<FazendaGeopoligonoResponseDTO> salvar(
            @PathVariable UUID fazendaId,
            @RequestBody @Valid FazendaGeopoligonoRequestDTO dto
    ) {

        return ResponseEntity.ok(
                geopoligonoService.salvar(
                        fazendaId,
                        dto
                )
        );
    }

    @DeleteMapping("/{fazendaId}/geopoligono")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> remover(
            @PathVariable UUID fazendaId
    ) {

        geopoligonoService.remover(
                fazendaId
        );

        return ResponseEntity
                .noContent()
                .build();
    }
}
