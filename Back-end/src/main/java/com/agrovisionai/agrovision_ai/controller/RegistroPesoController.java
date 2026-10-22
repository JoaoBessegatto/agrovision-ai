package com.agrovisionai.agrovision_ai.controller;

import com.agrovisionai.agrovision_ai.domain.dto.request.RegistroPesoRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.RegistroPesoResponseDTO;
import com.agrovisionai.agrovision_ai.service.RegistroPesoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(
        "/api/animais/{animalId}/pesagens"
)
public class RegistroPesoController {

    private final RegistroPesoService
            registroPesoService;


    public RegistroPesoController(
            RegistroPesoService registroPesoService
    ) {

        this.registroPesoService =
                registroPesoService;
    }


    // =========================================================
    // REGISTRAR
    // =========================================================

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RegistroPesoResponseDTO> registrar(
            @PathVariable UUID animalId,
            @Valid
            @RequestBody
            RegistroPesoRequestDTO dto
    ) {

        RegistroPesoResponseDTO response =
                registroPesoService.registrar(
                        animalId,
                        dto
                );


        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    // =========================================================
    // HISTÓRICO
    // =========================================================

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<RegistroPesoResponseDTO>> listarHistorico(
            @PathVariable UUID animalId
    ) {

        return ResponseEntity.ok(

                registroPesoService
                        .listarHistorico(
                                animalId
                        )
        );
    }


    // =========================================================
    // ÚLTIMA PESAGEM
    // =========================================================

    @GetMapping("/ultima")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RegistroPesoResponseDTO> buscarUltima(
            @PathVariable UUID animalId
    ) {

        return ResponseEntity.ok(

                registroPesoService
                        .buscarUltimaPesagem(
                                animalId
                        )
        );
    }
}