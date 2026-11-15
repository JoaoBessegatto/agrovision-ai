package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.domain.dto.request.AlterarCargoFuncionarioRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.FuncionarioResponseDTO;
import com.agrovisionai.agrovision_ai.domain.entity.Funcionario;
import com.agrovisionai.agrovision_ai.exception.ResouceNotFoundException;
import com.agrovisionai.agrovision_ai.repository.FuncionarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class FuncionarioService {

    private final FuncionarioRepository funcionarioRepository;
    private final FazendaAccessService fazendaAccessService;

    public FuncionarioService(
            FuncionarioRepository funcionarioRepository,
            FazendaAccessService fazendaAccessService
    ) {
        this.funcionarioRepository = funcionarioRepository;
        this.fazendaAccessService = fazendaAccessService;
    }

    @Transactional(readOnly = true)
    public FuncionarioResponseDTO buscarPorId(UUID id) {
        Funcionario funcionario = buscarFuncionario(id);

        fazendaAccessService.exigirProprietario(
                funcionario.getFazenda().getId()
        );

        return FuncionarioResponseDTO.from(funcionario);
    }

    @Transactional(readOnly = true)
    public List<FuncionarioResponseDTO> listarPorFazenda(UUID fazendaId) {
        fazendaAccessService.exigirProprietario(fazendaId);

        return funcionarioRepository.findByFazendaId(fazendaId)
                .stream()
                .map(FuncionarioResponseDTO::from)
                .toList();
    }

    public FuncionarioResponseDTO alterarCargo(
            UUID funcionarioId,
            AlterarCargoFuncionarioRequestDTO dto
    ) {
        Funcionario funcionario = buscarFuncionario(funcionarioId);

        fazendaAccessService.exigirProprietario(
                funcionario.getFazenda().getId()
        );

        funcionario.alterarCargo(dto.cargo());

        return FuncionarioResponseDTO.from(funcionario);
    }

    public void ativar(UUID funcionarioId) {
        Funcionario funcionario = buscarFuncionario(funcionarioId);

        fazendaAccessService.exigirProprietario(
                funcionario.getFazenda().getId()
        );

        funcionario.ativar();
    }

    public void desativar(UUID funcionarioId) {
        Funcionario funcionario = buscarFuncionario(funcionarioId);

        fazendaAccessService.exigirProprietario(
                funcionario.getFazenda().getId()
        );

        funcionario.desativar();
    }

    private Funcionario buscarFuncionario(UUID id) {
        return funcionarioRepository.findById(id)
                .orElseThrow(() ->
                        new ResouceNotFoundException(
                                "Funcionário não encontrado."
                        )
                );
    }
}
