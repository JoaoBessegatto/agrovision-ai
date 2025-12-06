package com.agrovisionai.agrovision_ai.controller;

import com.agrovisionai.agrovision_ai.domain.dto.FazendaRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.FazendaResponseDTO;
import com.agrovisionai.agrovision_ai.service.FazendaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("api/fazenda")
public class ControllerFazenda {
    @Autowired
    FazendaService fazendaService;

    @PostMapping("/{produtorId}")
    public ResponseEntity<FazendaResponseDTO>cadastrar(@PathVariable UUID produtorId, @Valid @RequestBody FazendaRequestDTO dto){
        FazendaResponseDTO fazendaResponse = fazendaService.salvar(dto,produtorId);
        return ResponseEntity.ok().body(fazendaResponse);
    }
}
