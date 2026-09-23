package com.agrovisionai.agrovision_ai.controller;

import com.agrovisionai.agrovision_ai.domain.dto.response.UsuarioContextResponseDTO;
import com.agrovisionai.agrovision_ai.service.UsuarioContextService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/me")
public class UsuarioContextController {

    private final UsuarioContextService usuarioContextService;

    public UsuarioContextController(
            UsuarioContextService usuarioContextService
    ) {
        this.usuarioContextService =
                usuarioContextService;
    }

    @GetMapping("/context")
    public ResponseEntity<UsuarioContextResponseDTO> getContexto() {

        UsuarioContextResponseDTO contexto =
                usuarioContextService.getContextoAtual();

        return ResponseEntity.ok(contexto);
    }
}