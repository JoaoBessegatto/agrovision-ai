package com.agrovisionai.agrovision_ai.controller;

import org.aspectj.lang.annotation.DeclareError;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/dashboard")
public class DashboardController {

    @GetMapping
    @PreAuthorize("hasRole('PRODUTOR') or hasRole('FUNCIONARIO')")
    public
}
