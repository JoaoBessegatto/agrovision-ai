package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.auth.CurrentUserProvider;
import com.agrovisionai.agrovision_ai.auth.Role;
import com.agrovisionai.agrovision_ai.auth.Usuario;
import com.agrovisionai.agrovision_ai.domain.dto.request.FazendaRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.FazendaAcessivelResponseDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.FazendaResponseDTO;
import com.agrovisionai.agrovision_ai.domain.entity.Fazenda;
import com.agrovisionai.agrovision_ai.domain.entity.Funcionario;
import com.agrovisionai.agrovision_ai.domain.entity.Produtor;
import com.agrovisionai.agrovision_ai.domain.enums.TipoExploracao;
import com.agrovisionai.agrovision_ai.exception.BusinessException;
import com.agrovisionai.agrovision_ai.exception.ResouceNotFoundException;
import com.agrovisionai.agrovision_ai.exception.UnauthorizedException;
import com.agrovisionai.agrovision_ai.repository.FazendaRepository;
import com.agrovisionai.agrovision_ai.repository.FuncionarioRepository;
import com.agrovisionai.agrovision_ai.repository.ProdutorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class FazendaService {

    private final FazendaRepository fazendaRepository;
    private final ProdutorRepository produtorRepository;
    private final FuncionarioRepository funcionarioRepository;
    private final CurrentUserProvider currentUserProvider;
    private final FazendaAccessService fazendaAccessService;

    public FazendaService(
            FazendaRepository fazendaRepository,
            ProdutorRepository produtorRepository,
            FuncionarioRepository funcionarioRepository,
            CurrentUserProvider currentUserProvider,
            FazendaAccessService fazendaAccessService
    ) {
        this.fazendaRepository = fazendaRepository;
        this.produtorRepository = produtorRepository;
        this.funcionarioRepository = funcionarioRepository;
        this.currentUserProvider = currentUserProvider;
        this.fazendaAccessService = fazendaAccessService;
    }

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
        fazenda.setProdutor(produtor);

        Fazenda fazendaSalva =
                fazendaRepository.save(fazenda);

        return new FazendaResponseDTO(fazendaSalva);
    }

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

        return new FazendaResponseDTO(
                fazendaRepository.save(fazenda)
        );
    }

    @Transactional
    public boolean deletar(UUID fazendaId) {

        Produtor produtor = getProdutorLogado();

        Fazenda fazenda =
                fazendaRepository
                        .findByIdAndProdutor(fazendaId, produtor)
                        .orElseThrow(() ->
                                new ResouceNotFoundException(
                                        "Fazenda não encontrada para o produtor autenticado."
                                )
                        );

        fazendaRepository.delete(fazenda);

        return true;
    }

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

    @Transactional(readOnly = true)
    public FazendaResponseDTO get(UUID fazendaId) {
        Fazenda fazenda =
                fazendaAccessService.exigirVisualizacao(fazendaId);

        return new FazendaResponseDTO(fazenda);
    }

    @Transactional(readOnly = true)
    public List<FazendaResponseDTO> getMinhasFazendas() {

        Produtor produtor = getProdutorLogado();

        return fazendaRepository
                .findByProdutor(produtor)
                .stream()
                .map(FazendaResponseDTO::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FazendaAcessivelResponseDTO> getFazendasAcessiveis() {

        Usuario usuario =
                currentUserProvider.getUsuarioAtual();

        if (usuario.getRole() == Role.ADMIN) {
            return fazendaRepository
                    .findAll()
                    .stream()
                    .map(FazendaAcessivelResponseDTO::admin)
                    .sorted((a, b) ->
                            a.nome().compareToIgnoreCase(b.nome())
                    )
                    .toList();
        }

        Map<UUID, FazendaAcessivelResponseDTO> acessos =
                new LinkedHashMap<>();

        produtorRepository
                .findByUsuario(usuario)
                .ifPresent(produtor ->
                        fazendaRepository
                                .findByProdutor(produtor)
                                .forEach(fazenda ->
                                        acessos.put(
                                                fazenda.getId(),
                                                FazendaAcessivelResponseDTO.proprietario(fazenda)
                                        )
                                )
                );

        List<Funcionario> vinculos =
                funcionarioRepository
                        .findByUsuarioIdAndAtivoTrue(usuario.getId());

        for (Funcionario funcionario : vinculos) {
            acessos.putIfAbsent(
                    funcionario.getFazenda().getId(),
                    FazendaAcessivelResponseDTO.funcionario(funcionario)
            );
        }

        List<FazendaAcessivelResponseDTO> resultado =
                new ArrayList<>(acessos.values());

        resultado.sort((a, b) ->
                a.nome().compareToIgnoreCase(b.nome())
        );

        return resultado;
    }

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

    private TipoExploracao converterTipoExploracao(String exploracao) {

        if (exploracao == null || exploracao.isBlank()) {
            throw new BusinessException(
                    "O tipo de exploração da fazenda é obrigatório."
            );
        }

        try {
            return TipoExploracao.valueOf(
                    exploracao.trim().toUpperCase()
            );

        } catch (IllegalArgumentException e) {
            throw new BusinessException(
                    "Tipo de exploração inválido."
            );
        }
    }
}
