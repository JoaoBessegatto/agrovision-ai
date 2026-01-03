package com.agrovisionai.agrovision_ai.controller;

import com.agrovisionai.agrovision_ai.domain.dto.request.ProdutorRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.ProdutorResponseDTO;
import com.agrovisionai.agrovision_ai.domain.entity.Produtor;
import com.agrovisionai.agrovision_ai.service.ProdutorService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @PreAuthorize("hasRole('PRODUTOR')")
    @PutMapping
    public ResponseEntity<ProdutorResponseDTO> atualizar(@RequestBody @Valid ProdutorRequestDTO dto){
        ProdutorResponseDTO produtorAtualizado = produtorService.atualizar(dto);
        return ResponseEntity.status(HttpStatus.OK).body(produtorAtualizado);
    }

    @PreAuthorize("hasRole('PRODUTOR')")
    @DeleteMapping
    public ResponseEntity<Void> deletar(){
        boolean deletado = produtorService.deletar();
        return deletado ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<ProdutorResponseDTO>> findAll(){
      List<ProdutorResponseDTO> produtores = produtorService.findAll();
      return ResponseEntity.ok().body(produtores);
    }

    @PreAuthorize("hasRole('PRODUTOR')")
    @GetMapping("/me")
    public ResponseEntity<ProdutorResponseDTO> findMe(){
        return ResponseEntity.ok().body(produtorService.findMe());
    }
}
