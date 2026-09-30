package com.agrovisionai.agrovision_ai.controller;

import com.agrovisionai.agrovision_ai.domain.dto.request.FazendaRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.FazendaResponseDTO;
import com.agrovisionai.agrovision_ai.service.FazendaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/fazenda")
public class FazendaController {

    private final FazendaService fazendaService;

    public FazendaController(
            FazendaService fazendaService
    ) {
        this.fazendaService = fazendaService;
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<FazendaResponseDTO> cadastrar(
            @RequestBody @Valid FazendaRequestDTO dto
    ) {

        FazendaResponseDTO fazenda =
                fazendaService.salvar(dto);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(fazenda);
    }

    @PutMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<FazendaResponseDTO> atualizar(
            @RequestBody @Valid FazendaRequestDTO dto
    ) {

        FazendaResponseDTO fazenda =
                fazendaService.atualizar(dto);

        return ResponseEntity.ok(fazenda);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deletar(
            @PathVariable("id") UUID id
    ) {

        fazendaService.deletar(id);

        return ResponseEntity
                .noContent()
                .build();
    }


    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<FazendaResponseDTO>> getAll() {

        return ResponseEntity.ok(
                fazendaService.getAll()
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<FazendaResponseDTO> getOne(
            @PathVariable("id") UUID id
    ) {

        return ResponseEntity.ok(
                fazendaService.get(id)
        );
    }
    @GetMapping("/minhas")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<FazendaResponseDTO>> getMinhasFazendas() {

        return ResponseEntity.ok(
                fazendaService.getMinhasFazendas()
        );
    }
}