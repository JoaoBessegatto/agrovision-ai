package com.agrovisionai.agrovision_ai.controller;

import com.agrovisionai.agrovision_ai.domain.dto.request.RebanhoRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.RebanhoResponseDTO;
import com.agrovisionai.agrovision_ai.repository.RebanhoRepository;
import com.agrovisionai.agrovision_ai.service.RebanhoService;
import com.agrovisionai.agrovision_ai.domain.dto.response.VendaRebanhoResponseDTO;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/rebanhos")
public class RebanhoController {

    private final RebanhoService rebanhoService;


    public RebanhoController(
            RebanhoService rebanhoService,
            RebanhoRepository rebanhoRepository
    ) {
        this.rebanhoService = rebanhoService;
    }


    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RebanhoResponseDTO> cadastrar(
            @RequestBody @Valid RebanhoRequestDTO dto
    ) {

        RebanhoResponseDTO rebanho =
                rebanhoService.cadastrar(dto);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(rebanho);
    }

    @PatchMapping("/{id}/vender")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<VendaRebanhoResponseDTO> venderRebanho(
            @PathVariable UUID id
    ) {

        VendaRebanhoResponseDTO response =
                rebanhoService.venderRebanho(
                        id
                );


        return ResponseEntity.ok(
                response
        );
    }

    @GetMapping("/fazenda/{fazendaId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<RebanhoResponseDTO>> listarPorFazenda(
            @PathVariable UUID fazendaId
    ) {

        return ResponseEntity.ok(
                rebanhoService
                        .listarPorFazenda(fazendaId)
        );
    }


    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RebanhoResponseDTO> buscarPorId(
            @PathVariable UUID id
    ) {

        return ResponseEntity.ok(
                rebanhoService.buscarPorId(id)
        );
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RebanhoResponseDTO> atualizar(
            @PathVariable UUID id,
            @RequestBody @Valid RebanhoRequestDTO dto
    ) {

        return ResponseEntity.ok(
                rebanhoService.atualizar(
                        id,
                        dto
                )
        );
    }


    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deletar(
            @PathVariable UUID id
    ) {

        rebanhoService.deletar(id);

        return ResponseEntity
                .noContent()
                .build();
    }
}