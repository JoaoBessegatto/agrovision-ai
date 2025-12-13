package com.agrovisionai.agrovision_ai.controller;

import com.agrovisionai.agrovision_ai.domain.dto.request.FazendaRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.FazendaResponseDTO;
import com.agrovisionai.agrovision_ai.service.FazendaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("api/fazenda")
public class ControllerFazenda {
    @Autowired
    FazendaService fazendaService;

    @PostMapping()
    public ResponseEntity<FazendaResponseDTO>cadastrar(@RequestBody @Valid FazendaRequestDTO dto){
        FazendaResponseDTO fazendaResponse = fazendaService.salvar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(fazendaResponse);
    }
}
