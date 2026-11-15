package com.agrovisionai.agrovision_ai.controller;

import com.agrovisionai.agrovision_ai.domain.dto.request.ConviteFuncionarioRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.ConviteFuncionarioResponseDTO;
import com.agrovisionai.agrovision_ai.service.ConviteFuncionarioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/funcionarios/convites")
public class ConviteFuncionarioController {

    private final ConviteFuncionarioService conviteFuncionarioService;

    public ConviteFuncionarioController(
            ConviteFuncionarioService conviteFuncionarioService
    ) {
        this.conviteFuncionarioService = conviteFuncionarioService;
    }

    @PostMapping
    public ResponseEntity<ConviteFuncionarioResponseDTO> convidar(
            @Valid @RequestBody ConviteFuncionarioRequestDTO dto
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(conviteFuncionarioService.convidar(dto));
    }

    @GetMapping("/fazenda/{fazendaId}")
    public ResponseEntity<List<ConviteFuncionarioResponseDTO>> listar(
            @PathVariable UUID fazendaId
    ) {
        return ResponseEntity.ok(
                conviteFuncionarioService.listarPorFazenda(fazendaId)
        );
    }

    @PostMapping("/{conviteId}/reenviar")
    public ResponseEntity<ConviteFuncionarioResponseDTO> reenviar(
            @PathVariable UUID conviteId
    ) {
        return ResponseEntity.ok(
                conviteFuncionarioService.reenviar(conviteId)
        );
    }

    @PatchMapping("/{conviteId}/cancelar")
    public ResponseEntity<Void> cancelar(
            @PathVariable UUID conviteId
    ) {
        conviteFuncionarioService.cancelar(conviteId);
        return ResponseEntity.noContent().build();
    }
}
