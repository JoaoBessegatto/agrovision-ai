package com.agrovisionai.agrovision_ai.controller;

import com.agrovisionai.agrovision_ai.domain.dto.request.ProdutorRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.ProdutorResponseDTO;
import com.agrovisionai.agrovision_ai.service.ProdutorService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/produtor")
public class ControllerProdutor {
    private final ProdutorService produtorService;

    public ControllerProdutor(ProdutorService produtorService) {
        this.produtorService = produtorService;
    }

    @PreAuthorize("hasRole('PRODUTOR')")
    @PostMapping
    public ResponseEntity<ProdutorResponseDTO> cadastrar(@RequestBody @Valid ProdutorRequestDTO dto){
        ProdutorResponseDTO produtorCadastrado = produtorService.cadastrar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(produtorCadastrado);
    }

}
