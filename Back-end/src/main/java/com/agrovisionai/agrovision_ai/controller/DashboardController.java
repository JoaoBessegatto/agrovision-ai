package com.agrovisionai.agrovision_ai.controller;

import com.agrovisionai.agrovision_ai.domain.dto.response.DashboardResponseDTO;
import com.agrovisionai.agrovision_ai.service.DashboardService;
import org.aspectj.lang.annotation.DeclareError;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/dashboard")
public class DashboardController {
    @Autowired
    DashboardService dashboardService;

    @GetMapping
    @PreAuthorize("hasRole('PRODUTOR')")
    public ResponseEntity<DashboardResponseDTO> getDashboard() {
        DashboardResponseDTO dashboard = dashboardService.criarDashboard();
        return ResponseEntity.ok(dashboard);
    }
}
