package com.agrovisionai.agrovision_ai.controller;

import com.agrovisionai.agrovision_ai.domain.dto.request.FazendaRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.FazendaResponseDTO;
import com.agrovisionai.agrovision_ai.service.FazendaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("api/fazenda")
public class ControllerFazenda {
    @Autowired
    FazendaService fazendaService;

    @PostMapping()
    @PreAuthorize("hasRole('PRODUTOR')")
    public ResponseEntity<FazendaResponseDTO>cadastrar(@RequestBody @Valid FazendaRequestDTO dto){
        FazendaResponseDTO fazendaResponse = fazendaService.salvar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(fazendaResponse);
    }

    @PutMapping()
    @PreAuthorize("hasRole('PRODUTOR')")
    public ResponseEntity<FazendaResponseDTO>atualizar(@RequestBody @Valid FazendaRequestDTO dto){
        FazendaResponseDTO fazendaResponse = fazendaService.atualizar(dto);
        return ResponseEntity.ok().body(fazendaResponse);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PRODUTOR')")
    public ResponseEntity<Void>deletar(@PathVariable UUID id){
        boolean deletado = fazendaService.deletar(id);
        return deletado ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    @GetMapping()
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<FazendaResponseDTO>>getAll(){
        return ResponseEntity.ok().body(fazendaService.getAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('PRODUTOR')")
    public ResponseEntity<FazendaResponseDTO>getOne(@PathVariable UUID fazendaId){
        return ResponseEntity.ok().body(fazendaService.get(fazendaId));
    }
}
