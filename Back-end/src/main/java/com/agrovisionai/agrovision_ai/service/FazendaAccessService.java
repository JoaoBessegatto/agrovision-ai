package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.auth.CurrentUserProvider;
import com.agrovisionai.agrovision_ai.auth.Role;
import com.agrovisionai.agrovision_ai.auth.Usuario;
import com.agrovisionai.agrovision_ai.domain.entity.Fazenda;
import com.agrovisionai.agrovision_ai.domain.entity.Funcionario;
import com.agrovisionai.agrovision_ai.domain.enums.PermissaoFuncionario;
import com.agrovisionai.agrovision_ai.exception.ResouceNotFoundException;
import com.agrovisionai.agrovision_ai.exception.UnauthorizedException;
import com.agrovisionai.agrovision_ai.repository.FazendaRepository;
import com.agrovisionai.agrovision_ai.repository.FuncionarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class FazendaAccessService {

    private final FazendaRepository fazendaRepository;
    private final FuncionarioRepository funcionarioRepository;
    private final CurrentUserProvider currentUserProvider;

    public FazendaAccessService(
            FazendaRepository fazendaRepository,
            FuncionarioRepository funcionarioRepository,
            CurrentUserProvider currentUserProvider
    ) {
        this.fazendaRepository = fazendaRepository;
        this.funcionarioRepository = funcionarioRepository;
        this.currentUserProvider = currentUserProvider;
    }

    public Fazenda exigirVisualizacao(UUID fazendaId) {
        return exigirPermissao(
                fazendaId,
                PermissaoFuncionario.VISUALIZAR_FAZENDA
        );
    }

    public Fazenda exigirPermissao(
            UUID fazendaId,
            PermissaoFuncionario permissao
    ) {
        Fazenda fazenda = buscarFazenda(fazendaId);
        Usuario usuario = currentUserProvider.getUsuarioAtual();

        if (usuario.getRole() == Role.ADMIN || ehProprietario(usuario, fazenda)) {
            return fazenda;
        }

        Funcionario funcionario = funcionarioRepository
                .findByUsuarioIdAndFazendaId(usuario.getId(), fazendaId)
                .orElseThrow(() ->
                        new UnauthorizedException(
                                "Usuário não possui acesso a esta fazenda."
                        )
                );

        if (!funcionario.isAtivo()) {
            throw new UnauthorizedException(
                    "Seu vínculo com esta fazenda está inativo."
            );
        }

        if (!funcionario.possuiPermissao(permissao)) {
            throw new UnauthorizedException(
                    "Seu cargo não possui permissão para realizar esta operação."
            );
        }

        return fazenda;
    }

    public Fazenda exigirProprietario(UUID fazendaId) {
        Fazenda fazenda = buscarFazenda(fazendaId);
        Usuario usuario = currentUserProvider.getUsuarioAtual();

        if (usuario.getRole() == Role.ADMIN || ehProprietario(usuario, fazenda)) {
            return fazenda;
        }

        throw new UnauthorizedException(
                "Apenas o produtor proprietário da fazenda pode realizar esta operação."
        );
    }

    public boolean ehProprietario(Usuario usuario, Fazenda fazenda) {
        return fazenda.getProdutor() != null
                && fazenda.getProdutor().getUsuario() != null
                && fazenda.getProdutor().getUsuario().getId().equals(usuario.getId());
    }

    private Fazenda buscarFazenda(UUID fazendaId) {
        return fazendaRepository.findById(fazendaId)
                .orElseThrow(() ->
                        new ResouceNotFoundException(
                                "Fazenda não encontrada."
                        )
                );
    }
}
