package com.agrovisionai.agrovision_ai.controller;

import com.agrovisionai.agrovision_ai.domain.dto.request.CadastroFuncionarioPorConviteRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.ConviteFuncionarioPublicoResponseDTO;
import com.agrovisionai.agrovision_ai.service.ConviteFuncionarioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/convites/funcionarios")
public class ConviteFuncionarioPublicoController {

    private final ConviteFuncionarioService conviteFuncionarioService;

    public ConviteFuncionarioPublicoController(
            ConviteFuncionarioService conviteFuncionarioService
    ) {
        this.conviteFuncionarioService = conviteFuncionarioService;
    }

    @GetMapping("/{token}")
    public ResponseEntity<ConviteFuncionarioPublicoResponseDTO> consultar(
            @PathVariable String token
    ) {
        return ResponseEntity.ok(
                conviteFuncionarioService.consultarPublico(token)
        );
    }

    @PostMapping("/cadastrar")
    public ResponseEntity<Void> cadastrar(
            @Valid @RequestBody CadastroFuncionarioPorConviteRequestDTO dto
    ) {
        conviteFuncionarioService.cadastrarEAceitar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/{token}/aceitar")
    public ResponseEntity<Void> aceitar(
            @PathVariable String token
    ) {
        conviteFuncionarioService.aceitarUsuarioExistente(token);
        return ResponseEntity.noContent().build();
    }
}
