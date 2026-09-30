package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.auth.CurrentUserProvider;
import com.agrovisionai.agrovision_ai.auth.Usuario;
import com.agrovisionai.agrovision_ai.domain.dto.request.RebanhoRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.RebanhoResponseDTO;
import com.agrovisionai.agrovision_ai.domain.entity.Fazenda;
import com.agrovisionai.agrovision_ai.domain.entity.Rebanho;
import com.agrovisionai.agrovision_ai.exception.BusinessException;
import com.agrovisionai.agrovision_ai.exception.ResouceNotFoundException;
import com.agrovisionai.agrovision_ai.exception.UnauthorizedException;
import com.agrovisionai.agrovision_ai.repository.FazendaRepository;
import com.agrovisionai.agrovision_ai.repository.RebanhoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class RebanhoService {

    private final RebanhoRepository rebanhoRepository;
    private final CurrentUserProvider currentUserProvider;
    private final FazendaRepository fazendaRepository;


    public RebanhoService(
            RebanhoRepository rebanhoRepository,
            CurrentUserProvider currentUserProvider,
            FazendaRepository fazendaRepository
    ) {
        this.rebanhoRepository = rebanhoRepository;
        this.currentUserProvider = currentUserProvider;
        this.fazendaRepository = fazendaRepository;
    }


    // =========================================================
    // CADASTRAR
    // =========================================================

    @Transactional
    public RebanhoResponseDTO cadastrar(
            RebanhoRequestDTO dto
    ) {

        Fazenda fazenda =
                getFazendaAutorizada(
                        dto.fazendaId()
                );

        Rebanho rebanho =
                new Rebanho(
                        dto.nome(),
                        dto.descricao(),
                        fazenda
                );

        Rebanho rebanhoSalvo =
                rebanhoRepository.save(rebanho);

        return RebanhoResponseDTO.from(
                rebanhoSalvo
        );
    }


    // =========================================================
    // LISTAR POR FAZENDA
    // =========================================================

    @Transactional(readOnly = true)
    public List<RebanhoResponseDTO> listarPorFazenda(
            UUID fazendaId
    ) {

        /*
         * Antes de listar qualquer coisa,
         * verificamos se o usuário realmente
         * possui acesso à fazenda.
         */
        getFazendaAutorizada(fazendaId);


        return rebanhoRepository
                .findByFazendaIdOrderByNomeAsc(
                        fazendaId
                )
                .stream()
                .map(RebanhoResponseDTO::from)
                .toList();
    }


    // =========================================================
    // BUSCAR REBANHO
    // =========================================================

    @Transactional(readOnly = true)
    public RebanhoResponseDTO buscarPorId(
            UUID rebanhoId
    ) {

        Rebanho rebanho =
                getRebanhoAutorizado(
                        rebanhoId
                );

        return RebanhoResponseDTO.from(
                rebanho
        );
    }


    // =========================================================
    // ATUALIZAR
    // =========================================================

    @Transactional
    public RebanhoResponseDTO atualizar(
            UUID rebanhoId,
            RebanhoRequestDTO dto
    ) {

        Rebanho rebanho =
                getRebanhoAutorizado(
                        rebanhoId
                );


        /*
         * Neste endpoint não permitiremos
         * transferir o rebanho para outra
         * fazenda acidentalmente.
         */
        if (
                !rebanho
                        .getFazenda()
                        .getId()
                        .equals(dto.fazendaId())
        ) {

            throw new BusinessException(
                    "A fazenda informada não corresponde à fazenda do rebanho."
            );
        }


        rebanho.atualizar(
                dto.nome(),
                dto.descricao()
        );


        return RebanhoResponseDTO.from(
                rebanho
        );
    }


    // =========================================================
    // DELETAR
    // =========================================================

    @Transactional
    public void deletar(
            UUID rebanhoId
    ) {

        Rebanho rebanho =
                getRebanhoAutorizado(
                        rebanhoId
                );


        /*
         * Como a relação possui CascadeType.ALL
         * e orphanRemoval, excluir um rebanho
         * poderia também excluir animais.
         *
         * Por segurança, bloqueamos.
         */
        if (
                rebanho.getQuantidadeAnimais() > 0
        ) {

            throw new BusinessException(
                    "Não é possível excluir um rebanho que possui animais cadastrados."
            );
        }


        rebanhoRepository.delete(
                rebanho
        );
    }


    // =========================================================
    // MÉTODOS AUXILIARES
    // =========================================================

    private Fazenda getFazendaAutorizada(
            UUID fazendaId
    ) {

        Usuario usuarioLogado =
                currentUserProvider
                        .getUsuarioAtual();


        Fazenda fazenda =
                fazendaRepository
                        .findById(fazendaId)
                        .orElseThrow(() ->
                                new ResouceNotFoundException(
                                        "Fazenda não encontrada."
                                )
                        );


        validarPermissao(
                usuarioLogado,
                fazenda
        );


        return fazenda;
    }


    private Rebanho getRebanhoAutorizado(
            UUID rebanhoId
    ) {

        Rebanho rebanho =
                rebanhoRepository
                        .findById(rebanhoId)
                        .orElseThrow(() ->
                                new ResouceNotFoundException(
                                        "Rebanho não encontrado."
                                )
                        );


        Usuario usuarioLogado =
                currentUserProvider
                        .getUsuarioAtual();


        validarPermissao(
                usuarioLogado,
                rebanho.getFazenda()
        );


        return rebanho;
    }


    /*
     * Por enquanto apenas o proprietário
     * da fazenda possui acesso.
     *
     * Quando implementarmos Funcionário,
     * ampliaremos essa regra.
     */
    private void validarPermissao(
            Usuario usuario,
            Fazenda fazenda
    ) {

        if (
                !fazenda
                        .getProdutor()
                        .getUsuario()
                        .getId()
                        .equals(usuario.getId())
        ) {

            throw new UnauthorizedException(
                    "Você não possui acesso a esta fazenda."
            );
        }
    }
}