package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.domain.dto.request.RebanhoRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.RebanhoResponseDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.VendaRebanhoResponseDTO;
import com.agrovisionai.agrovision_ai.domain.entity.Animal;
import com.agrovisionai.agrovision_ai.domain.entity.Fazenda;
import com.agrovisionai.agrovision_ai.domain.entity.Rebanho;
import com.agrovisionai.agrovision_ai.domain.enums.PermissaoFuncionario;
import com.agrovisionai.agrovision_ai.domain.enums.SituacaoAnimal;
import com.agrovisionai.agrovision_ai.exception.BusinessException;
import com.agrovisionai.agrovision_ai.exception.ResouceNotFoundException;
import com.agrovisionai.agrovision_ai.repository.AnimalRepository;
import com.agrovisionai.agrovision_ai.repository.AreaManejoRepository;
import com.agrovisionai.agrovision_ai.repository.RebanhoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class RebanhoService {

    private final RebanhoRepository rebanhoRepository;
    private final AnimalRepository animalRepository;
    private final AreaManejoRepository areaManejoRepository;
    private final FazendaAccessService fazendaAccessService;

    public RebanhoService(
            RebanhoRepository rebanhoRepository,
            AnimalRepository animalRepository,
            AreaManejoRepository areaManejoRepository,
            FazendaAccessService fazendaAccessService
    ) {
        this.rebanhoRepository = rebanhoRepository;
        this.animalRepository = animalRepository;
        this.areaManejoRepository = areaManejoRepository;
        this.fazendaAccessService = fazendaAccessService;
    }

    @Transactional
    public RebanhoResponseDTO cadastrar(RebanhoRequestDTO dto) {

        Fazenda fazenda =
                fazendaAccessService.exigirPermissao(
                        dto.fazendaId(),
                        PermissaoFuncionario.GERENCIAR_REBANHO
                );

        Rebanho rebanho =
                new Rebanho(
                        dto.nome(),
                        dto.descricao(),
                        fazenda
                );

        return RebanhoResponseDTO.from(
                rebanhoRepository.save(rebanho)
        );
    }

    @Transactional
    public VendaRebanhoResponseDTO venderRebanho(UUID rebanhoId) {

        Rebanho rebanho = buscarRebanho(rebanhoId);

        fazendaAccessService.exigirProprietario(
                rebanho.getFazenda().getId()
        );

        List<Animal> animais =
                animalRepository.findByRebanhoId(rebanhoId);

        if (animais.isEmpty()) {
            throw new BusinessException(
                    "Não é possível vender um rebanho sem animais."
            );
        }

        int animaisVendidos = 0;
        int jaVendidos = 0;
        int mortosIgnorados = 0;

        for (Animal animal : animais) {

            if (animal.getSituacao() == SituacaoAnimal.MORTO) {
                mortosIgnorados++;
                continue;
            }

            if (animal.getSituacao() == SituacaoAnimal.VENDIDO) {
                jaVendidos++;
                continue;
            }

            animal.marcarComoVendido();
            animaisVendidos++;
        }

        if (animaisVendidos == 0) {
            throw new BusinessException(
                    "Este rebanho não possui animais disponíveis para venda."
            );
        }

        return new VendaRebanhoResponseDTO(
                rebanho.getId(),
                rebanho.getNome(),
                animais.size(),
                animaisVendidos,
                jaVendidos,
                mortosIgnorados
        );
    }

    @Transactional(readOnly = true)
    public List<RebanhoResponseDTO> listarPorFazenda(UUID fazendaId) {

        fazendaAccessService.exigirVisualizacao(fazendaId);

        return rebanhoRepository
                .findByFazendaIdOrderByNomeAsc(fazendaId)
                .stream()
                .map(RebanhoResponseDTO::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public RebanhoResponseDTO buscarPorId(UUID rebanhoId) {

        Rebanho rebanho = buscarRebanho(rebanhoId);

        fazendaAccessService.exigirVisualizacao(
                rebanho.getFazenda().getId()
        );

        return RebanhoResponseDTO.from(rebanho);
    }

    @Transactional
    public RebanhoResponseDTO atualizar(
            UUID rebanhoId,
            RebanhoRequestDTO dto
    ) {
        Rebanho rebanho = buscarRebanho(rebanhoId);

        fazendaAccessService.exigirPermissao(
                rebanho.getFazenda().getId(),
                PermissaoFuncionario.GERENCIAR_REBANHO
        );

        if (!rebanho.getFazenda().getId().equals(dto.fazendaId())) {
            throw new BusinessException(
                    "A fazenda informada não corresponde à fazenda do rebanho."
            );
        }

        rebanho.atualizar(
                dto.nome(),
                dto.descricao()
        );

        return RebanhoResponseDTO.from(rebanho);
    }

    @Transactional
    public void deletar(UUID rebanhoId) {

        Rebanho rebanho = buscarRebanho(rebanhoId);

        fazendaAccessService.exigirPermissao(
                rebanho.getFazenda().getId(),
                PermissaoFuncionario.GERENCIAR_REBANHO
        );

        if (rebanho.getQuantidadeAnimais() > 0) {
            throw new BusinessException(
                    "Não é possível excluir um rebanho que possui animais cadastrados."
            );
        }

        areaManejoRepository
                .findByRebanhoId(
                        rebanhoId
                )
                .ifPresent(area -> {
                    area.setRebanho(null);
                    area.setAtualizadoEm(
                            java.time.LocalDateTime.now()
                    );
                });

        rebanhoRepository.delete(rebanho);
    }

    private Rebanho buscarRebanho(UUID rebanhoId) {
        return rebanhoRepository
                .findById(rebanhoId)
                .orElseThrow(() ->
                        new ResouceNotFoundException(
                                "Rebanho não encontrado."
                        )
                );
    }
}
