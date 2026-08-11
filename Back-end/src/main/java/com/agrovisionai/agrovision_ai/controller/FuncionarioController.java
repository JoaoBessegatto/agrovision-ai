package com.agrovisionai.agrovision_ai.controller;

import com.agrovisionai.agrovision_ai.domain.dto.request.AlterarCargoFuncionarioRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.request.FuncionarioRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.FuncionarioResponseDTO;
import com.agrovisionai.agrovision_ai.service.FuncionarioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("api/funcionarios")
public class FuncionarioController {

    private final FuncionarioService funcionarioService;

    public FuncionarioController(FuncionarioService funcionarioService) {
        this.funcionarioService = funcionarioService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FuncionarioResponseDTO cadastrar(
            @Valid @RequestBody FuncionarioRequestDTO dto
    ) {
        return funcionarioService.cadastrar(dto);
    }

    @GetMapping("/{id}")
    public FuncionarioResponseDTO buscarPorId(
            @PathVariable UUID id
    ) {
        return funcionarioService.buscarPorId(id);
    }

    @GetMapping("/fazenda/{fazendaId}")
    public List<FuncionarioResponseDTO> listarPorFazenda(
            @PathVariable UUID fazendaId
    ) {
        return funcionarioService.listarPorFazenda(fazendaId);
    }

    @PatchMapping("/{id}/cargo")
    public FuncionarioResponseDTO alterarCargo(
            @PathVariable UUID id,
            @Valid @RequestBody AlterarCargoFuncionarioRequestDTO dto
    ) {
        return funcionarioService.alterarCargo(id, dto);
    }

    @PatchMapping("/{id}/ativar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void ativar(
            @PathVariable UUID id
    ) {
        funcionarioService.ativar(id);
    }

    @PatchMapping("/{id}/desativar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void desativar(
            @PathVariable UUID id
    ) {
        funcionarioService.desativar(id);
    }
}