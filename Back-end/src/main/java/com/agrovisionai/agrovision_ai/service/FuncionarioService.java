package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.auth.CurrentUserProvider;
import com.agrovisionai.agrovision_ai.auth.Usuario;
import com.agrovisionai.agrovision_ai.auth.UsuarioRepository;
import com.agrovisionai.agrovision_ai.domain.dto.request.AlterarCargoFuncionarioRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.request.FuncionarioRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.FuncionarioResponseDTO;
import com.agrovisionai.agrovision_ai.domain.entity.Fazenda;
import com.agrovisionai.agrovision_ai.domain.entity.Funcionario;
import com.agrovisionai.agrovision_ai.exception.BusinessException;
import com.agrovisionai.agrovision_ai.exception.ResouceNotFoundException;
import com.agrovisionai.agrovision_ai.exception.UnauthorizedException;
import com.agrovisionai.agrovision_ai.repository.FazendaRepository;
import com.agrovisionai.agrovision_ai.repository.FuncionarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class FuncionarioService {

    private final FuncionarioRepository funcionarioRepository;
    private final CurrentUserProvider currentUserProvider;
    private final UsuarioRepository usuarioRepository;
    private final FazendaRepository fazendaRepository;

    public FuncionarioService(
            FuncionarioRepository funcionarioRepository,
            CurrentUserProvider currentUserProvider,
            UsuarioRepository usuarioRepository,
            FazendaRepository fazendaRepository
    ) {
        this.funcionarioRepository = funcionarioRepository;
        this.currentUserProvider = currentUserProvider;
        this.usuarioRepository = usuarioRepository;
        this.fazendaRepository = fazendaRepository;
    }

    public FuncionarioResponseDTO cadastrar(FuncionarioRequestDTO dto) {

        Usuario usuarioLogado = currentUserProvider.getUsuarioAtual();

        Fazenda fazenda = buscarFazenda(dto.fazendaId());

        validarPermissaoProdutor(usuarioLogado, fazenda);

        Usuario usuarioFuncionario = buscarUsuario(dto.usuarioId());

        if (funcionarioRepository.existsByUsuarioIdAndFazendaId(
                usuarioFuncionario.getId(),
                fazenda.getId())) {

            throw new BusinessException(
                    "Este usuário já é funcionário desta fazenda.");
        }

        Funcionario funcionario = new Funcionario(
                usuarioFuncionario,
                fazenda,
                dto.cargo()
        );

        funcionarioRepository.save(funcionario);

        return FuncionarioResponseDTO.from(funcionario);
    }

    @Transactional(readOnly = true)
    public FuncionarioResponseDTO buscarPorId(UUID id) {

        Funcionario funcionario = buscarFuncionario(id);

        validarPermissaoProdutor(
                currentUserProvider.getUsuarioAtual(),
                funcionario.getFazenda()
        );

        return FuncionarioResponseDTO.from(funcionario);
    }

    @Transactional(readOnly = true)
    public List<FuncionarioResponseDTO> listarPorFazenda(UUID fazendaId) {

        Fazenda fazenda = buscarFazenda(fazendaId);

        validarPermissaoProdutor(
                currentUserProvider.getUsuarioAtual(),
                fazenda
        );

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

        validarPermissaoProdutor(
                currentUserProvider.getUsuarioAtual(),
                funcionario.getFazenda()
        );

        funcionario.alterarCargo(dto.cargo());

        return FuncionarioResponseDTO.from(funcionario);
    }

    public void ativar(UUID funcionarioId) {

        Funcionario funcionario = buscarFuncionario(funcionarioId);

        validarPermissaoProdutor(
                currentUserProvider.getUsuarioAtual(),
                funcionario.getFazenda()
        );

        funcionario.ativar();
    }

    public void desativar(UUID funcionarioId) {

        Funcionario funcionario = buscarFuncionario(funcionarioId);

        validarPermissaoProdutor(
                currentUserProvider.getUsuarioAtual(),
                funcionario.getFazenda()
        );

        funcionario.desativar();
    }

    // ==========================
    // Métodos privados
    // ==========================

    private Funcionario buscarFuncionario(UUID id) {
        return funcionarioRepository.findById(id)
                .orElseThrow(() ->
                        new ResouceNotFoundException("Funcionário não encontrado."));
    }

    private Fazenda buscarFazenda(UUID id) {
        return fazendaRepository.findById(id)
                .orElseThrow(() ->
                        new ResouceNotFoundException("Fazenda não encontrada."));
    }

    private Usuario buscarUsuario(UUID id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() ->
                        new ResouceNotFoundException("Usuário não encontrado."));
    }

    private void validarPermissaoProdutor(
            Usuario usuario,
            Fazenda fazenda
    ) {

        if (!fazenda.getProdutor()
                .getUsuario()
                .getId()
                .equals(usuario.getId())) {

            throw new UnauthorizedException(
                    "Apenas o produtor proprietário da fazenda pode realizar esta operação.");
        }
    }
}