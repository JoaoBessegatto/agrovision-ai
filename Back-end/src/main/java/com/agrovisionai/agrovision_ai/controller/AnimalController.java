package com.agrovisionai.agrovision_ai.controller;

import com.agrovisionai.agrovision_ai.domain.dto.request.AnimalRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.request.NovoRebanhoRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.AnimalResponseDTO;
import com.agrovisionai.agrovision_ai.service.AnimalService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/animais")
public class AnimalController {

    private final AnimalService animalService;


    public AnimalController(
            AnimalService animalService
    ) {
        this.animalService =
                animalService;
    }


    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AnimalResponseDTO> cadastrar(
            @Valid @RequestBody AnimalRequestDTO dto
    ) {

        AnimalResponseDTO response =
                animalService.cadastrar(dto);


        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AnimalResponseDTO> buscarPorId(
            @PathVariable UUID id
    ) {

        return ResponseEntity.ok(
                animalService.buscarPorId(id)
        );
    }


    @GetMapping("/fazenda/{fazendaId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AnimalResponseDTO>> listarPorFazenda(
            @PathVariable UUID fazendaId
    ) {

        return ResponseEntity.ok(
                animalService.listarPorFazenda(
                        fazendaId
                )
        );
    }

    @GetMapping("/rebanho/{rebanhoId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AnimalResponseDTO>> listarPorRebanho(
            @PathVariable UUID rebanhoId
    ) {

        return ResponseEntity.ok(
                animalService.listarPorRebanho(
                        rebanhoId
                )
        );
    }


    @PatchMapping("/{animalId}/transferencia")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> transferirAnimal(
            @PathVariable UUID animalId,
            @RequestBody NovoRebanhoRequestDTO dto
    ) {

        animalService.transferirAnimal(
                animalId,
                dto.novoRebanho()
        );


        return ResponseEntity
                .noContent()
                .build();
    }


    @PatchMapping("/{animalId}/inativar")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> inativar(
            @PathVariable UUID animalId
    ) {

        animalService.inativar(
                animalId
        );


        return ResponseEntity
                .noContent()
                .build();
    }

    @PatchMapping("/{animalId}/ativar")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> ativar(
            @PathVariable UUID animalId
    ) {

        animalService.ativar(
                animalId
        );


        return ResponseEntity
                .noContent()
                .build();
    }
}