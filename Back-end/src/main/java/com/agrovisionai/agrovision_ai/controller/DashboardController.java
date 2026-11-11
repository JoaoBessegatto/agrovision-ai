package com.agrovisionai.agrovision_ai.controller;

import com.agrovisionai.agrovision_ai.domain.dto.response.DashboardResponseDTO;

import com.agrovisionai.agrovision_ai.service.DashboardService;

import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;


@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {


    private final DashboardService dashboardService;


    public DashboardController(
            DashboardService dashboardService
    ) {

        this.dashboardService =
                dashboardService;
    }

    @GetMapping("/fazenda/{fazendaId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DashboardResponseDTO> buscarPorFazenda(
            @PathVariable UUID fazendaId
    ) {

        DashboardResponseDTO response =
                dashboardService
                        .buscarPorFazenda(
                                fazendaId
                        );


        return ResponseEntity.ok(
                response
        );
    }
}