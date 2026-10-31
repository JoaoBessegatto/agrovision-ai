package com.agrovisionai.agrovision_ai.controller;

import com.agrovisionai.agrovision_ai.domain.dto.response.RegistroPesoResponseDTO;
import com.agrovisionai.agrovision_ai.service.RegistroPesoService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/pesagens")
public class PesagemController {

    private final RegistroPesoService registroPesoService;

    public PesagemController(
            RegistroPesoService registroPesoService
    ) {
        this.registroPesoService =
                registroPesoService;
    }


    // =========================================================
    // PESAGENS DA FAZENDA
    // =========================================================

    @GetMapping("/fazenda/{fazendaId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<RegistroPesoResponseDTO>> listarPorFazenda(
            @PathVariable UUID fazendaId
    ) {

        return ResponseEntity.ok(
                registroPesoService
                        .listarPorFazenda(
                                fazendaId
                        )
        );
    }
}