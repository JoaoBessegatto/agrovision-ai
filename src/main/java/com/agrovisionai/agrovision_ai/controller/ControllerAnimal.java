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

import java.util.UUID;

@RestController
@RequestMapping("api/animal")
public class ControllerAnimal {
    private final AnimalService animalService;

    public ControllerAnimal(AnimalService animalService) {
        this.animalService = animalService;
    }

    @PostMapping
    @PreAuthorize("hasRole('PRODUTOR,FUNCIONARIO')")
    public ResponseEntity<AnimalResponseDTO>cadastrar(@Valid AnimalRequestDTO dto){
        AnimalResponseDTO animalResponseDTO = animalService.cadastrar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(animalResponseDTO);
    }

    @PutMapping("/{animalId}/transferir-animal")
    @PreAuthorize("hasRole('PRODUTOR,FUNCIONARIO')")
    public ResponseEntity<Void>trasferirAnimal(@PathVariable UUID animalId, @RequestBody NovoRebanhoRequestDTO rebanhoId){
        animalService.trasferirAnimal(animalId,rebanhoId.novoRebanho());
        return ResponseEntity.ok().build();
    }
}
