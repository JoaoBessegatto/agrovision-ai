package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.auth.CurrentUserProvider;
import com.agrovisionai.agrovision_ai.auth.Role;
import com.agrovisionai.agrovision_ai.auth.Usuario;
import com.agrovisionai.agrovision_ai.domain.dto.request.FazendaRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.FazendaResponseDTO;
import com.agrovisionai.agrovision_ai.domain.entity.Fazenda;
import com.agrovisionai.agrovision_ai.domain.entity.Produtor;
import com.agrovisionai.agrovision_ai.domain.enums.TipoExploracao;
import com.agrovisionai.agrovision_ai.exception.BusinessException;
import com.agrovisionai.agrovision_ai.exception.ResouceNotFoundException;
import com.agrovisionai.agrovision_ai.exception.UnauthorizedException;
import com.agrovisionai.agrovision_ai.repository.FazendaRepository;
import com.agrovisionai.agrovision_ai.repository.ProdutorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class FazendaService {

    private final FazendaRepository fazendaRepository;
    private final ProdutorRepository produtorRepository;
    private final CurrentUserProvider currentUserProvider;

    public FazendaService(
            FazendaRepository fazendaRepository,
            ProdutorRepository produtorRepository,
            CurrentUserProvider currentUserProvider
    ) {
        this.fazendaRepository = fazendaRepository;
        this.produtorRepository = produtorRepository;
        this.currentUserProvider = currentUserProvider;
    }


    // =========================================================
    // CADASTRAR FAZENDA
    // =========================================================

    @Transactional
    public FazendaResponseDTO salvar(FazendaRequestDTO dto) {

        Produtor produtor = getProdutorLogado();

        Fazenda fazenda = new Fazenda();

        fazenda.setNome(dto.nome());
        fazenda.setCidade(dto.cidade());
        fazenda.setEstado(dto.estado());
        fazenda.setLatitude(dto.latitude());
        fazenda.setLongitude(dto.longitude());
        fazenda.setAreaTotalHa(dto.areaTotalHa());
        fazenda.setExploracao(converterTipoExploracao(dto.exploracao()));
        fazenda.setGeopoligono(dto.geopoligono());

        // A fazenda pertence ao produtor autenticado.
        fazenda.setProdutor(produtor);

        Fazenda fazendaSalva =
                fazendaRepository.save(fazenda);

        return new FazendaResponseDTO(fazendaSalva);
    }


    // =========================================================
    // ATUALIZAR FAZENDA
    // =========================================================

    @Transactional
    public FazendaResponseDTO atualizar(FazendaRequestDTO dto) {

        Produtor produtor = getProdutorLogado();

        Fazenda fazenda =
                fazendaRepository
                        .findByIdAndProdutor(dto.id(), produtor)
                        .orElseThrow(() ->
                                new ResouceNotFoundException(
                                        "Fazenda não encontrada para o produtor autenticado."
                                )
                        );

        fazenda.setNome(dto.nome());
        fazenda.setCidade(dto.cidade());
        fazenda.setEstado(dto.estado());
        fazenda.setLatitude(dto.latitude());
        fazenda.setLongitude(dto.longitude());
        fazenda.setAreaTotalHa(dto.areaTotalHa());
        fazenda.setExploracao(converterTipoExploracao(dto.exploracao()));
        fazenda.setGeopoligono(dto.geopoligono());

        Fazenda fazendaAtualizada =
                fazendaRepository.save(fazenda);

        return new FazendaResponseDTO(
                fazendaAtualizada
        );
    }


    // =========================================================
    // DELETAR FAZENDA
    // =========================================================

    @Transactional
    public boolean deletar(UUID fazendaId) {

        Produtor produtor = getProdutorLogado();

        Fazenda fazenda =
                fazendaRepository
                        .findByIdAndProdutor(
                                fazendaId,
                                produtor
                        )
                        .orElseThrow(() ->
                                new ResouceNotFoundException(
                                        "Fazenda não encontrada para o produtor autenticado."
                                )
                        );

        fazendaRepository.delete(fazenda);

        return true;
    }


    // =========================================================
    // LISTAR TODAS AS FAZENDAS
    // SOMENTE ADMIN
    // =========================================================

    @Transactional(readOnly = true)
    public List<FazendaResponseDTO> getAll() {

        Usuario usuarioLogado =
                currentUserProvider.getUsuarioAtual();

        if (usuarioLogado.getRole() != Role.ADMIN) {

            throw new UnauthorizedException(
                    "Somente administradores podem listar todas as fazendas."
            );
        }

        return fazendaRepository
                .findAll()
                .stream()
                .map(FazendaResponseDTO::new)
                .toList();
    }


    // =========================================================
    // BUSCAR UMA FAZENDA DO PRODUTOR LOGADO
    // =========================================================

    @Transactional(readOnly = true)
    public FazendaResponseDTO get(UUID fazendaId) {

        Produtor produtor = getProdutorLogado();

        Fazenda fazenda =
                fazendaRepository
                        .findByIdAndProdutor(
                                fazendaId,
                                produtor
                        )
                        .orElseThrow(() ->
                                new ResouceNotFoundException(
                                        "Fazenda não encontrada para o produtor autenticado."
                                )
                        );

        return new FazendaResponseDTO(fazenda);
    }


    // =========================================================
    // LISTAR MINHAS FAZENDAS
    // =========================================================

    @Transactional(readOnly = true)
    public List<FazendaResponseDTO> getMinhasFazendas() {

        Produtor produtor = getProdutorLogado();

        return fazendaRepository
                .findByProdutor(produtor)
                .stream()
                .map(FazendaResponseDTO::new)
                .toList();
    }


    // =========================================================
    // MÉTODOS AUXILIARES
    // =========================================================

    private Produtor getProdutorLogado() {

        Usuario usuarioLogado =
                currentUserProvider.getUsuarioAtual();

        return produtorRepository
                .findByUsuario(usuarioLogado)
                .orElseThrow(() ->
                        new BusinessException(
                                "O usuário autenticado não possui perfil de produtor."
                        )
                );
    }


    private TipoExploracao converterTipoExploracao(
            String exploracao
    ) {

        if (exploracao == null || exploracao.isBlank()) {

            throw new BusinessException(
                    "O tipo de exploração da fazenda é obrigatório."
            );
        }

        try {

            return TipoExploracao.valueOf(
                    exploracao
                            .trim()
                            .toUpperCase()
            );

        } catch (IllegalArgumentException e) {

            throw new BusinessException(
                    "Tipo de exploração inválido."
            );
        }
    }

}