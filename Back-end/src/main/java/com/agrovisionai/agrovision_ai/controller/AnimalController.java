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
@RequestMapping("api/animais")
public class AnimalController {

    private final AnimalService animalService;

    public AnimalController(AnimalService animalService) {
        this.animalService = animalService;
    }

    @PostMapping
    @PreAuthorize("hasRole('PRODUTOR') or hasRole('FUNCIONARIO')")
    public ResponseEntity<AnimalResponseDTO> cadastrar(
            @Valid @RequestBody AnimalRequestDTO dto) {

        AnimalResponseDTO response = animalService.cadastrar(dto);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('PRODUTOR') or hasRole('FUNCIONARIO')")
    public ResponseEntity<AnimalResponseDTO> buscarPorId(
            @PathVariable UUID id) {

        return ResponseEntity.ok(
                animalService.buscarPorId(id)
        );
    }

    @GetMapping("/identificacao/{identificacao}")
    @PreAuthorize("hasRole('PRODUTOR') or hasRole('FUNCIONARIO')")
    public ResponseEntity<AnimalResponseDTO> buscarPorIdentificacao(
            @PathVariable String identificacao) {

        return ResponseEntity.ok(
                animalService.buscarPorIdentificacao(identificacao)
        );
    }

    @GetMapping
    @PreAuthorize("hasRole('PRODUTOR') or hasRole('FUNCIONARIO')")
    public ResponseEntity<List<AnimalResponseDTO>> listarTodos() {

        return ResponseEntity.ok(
                animalService.listarTodos()
        );
    }

    @GetMapping("/rebanho/{rebanhoId}")
    @PreAuthorize("hasRole('PRODUTOR') or hasRole('FUNCIONARIO')")
    public ResponseEntity<List<AnimalResponseDTO>> listarPorRebanho(
            @PathVariable UUID rebanhoId) {

        return ResponseEntity.ok(
                animalService.listarPorRebanho(rebanhoId)
        );
    }

    @GetMapping("/fazenda/{fazendaId}")
    @PreAuthorize("hasRole('PRODUTOR') or hasRole('FUNCIONARIO')")
    public ResponseEntity<List<AnimalResponseDTO>> listarPorFazenda(
            @PathVariable UUID fazendaId) {

        return ResponseEntity.ok(
                animalService.listarPorFazenda(fazendaId)
        );
    }

    @GetMapping("/ativos")
    @PreAuthorize("hasRole('PRODUTOR') or hasRole('FUNCIONARIO')")
    public ResponseEntity<List<AnimalResponseDTO>> listarAtivos() {

        return ResponseEntity.ok(
                animalService.listarAtivos()
        );
    }

    @GetMapping("/inativos")
    @PreAuthorize("hasRole('PRODUTOR') or hasRole('FUNCIONARIO')")
    public ResponseEntity<List<AnimalResponseDTO>> listarInativos() {

        return ResponseEntity.ok(
                animalService.listarInativos()
        );
    }

    @PatchMapping("/{animalId}/transferencia")
    @PreAuthorize("hasRole('PRODUTOR') or hasRole('FUNCIONARIO')")
    public ResponseEntity<Void> transferirAnimal(
            @PathVariable UUID animalId,
            @RequestBody NovoRebanhoRequestDTO dto) {

        animalService.transferirAnimal(
                animalId,
                dto.novoRebanho()
        );

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{animalId}/inativar")
    @PreAuthorize("hasRole('PRODUTOR') or hasRole('FUNCIONARIO')")
    public ResponseEntity<Void> inativar(
            @PathVariable UUID animalId) {

        animalService.inativar(animalId);

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{animalId}/ativar")
    @PreAuthorize("hasRole('PRODUTOR') or hasRole('FUNCIONARIO')")
    public ResponseEntity<Void> ativar(
            @PathVariable UUID animalId) {

        animalService.ativar(animalId);

        return ResponseEntity.noContent().build();
    }

}