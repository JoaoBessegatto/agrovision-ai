package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.domain.dto.request.AreaManejoRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.request.AssociarRebanhoAreaRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.AreaManejoResponseDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.IndicadoresAreaManejoDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.ResumoAreasManejoResponseDTO;
import com.agrovisionai.agrovision_ai.domain.entity.Animal;
import com.agrovisionai.agrovision_ai.domain.entity.AreaManejo;
import com.agrovisionai.agrovision_ai.domain.entity.Fazenda;
import com.agrovisionai.agrovision_ai.domain.entity.FazendaGeopoligono;
import com.agrovisionai.agrovision_ai.domain.entity.Rebanho;
import com.agrovisionai.agrovision_ai.domain.enums.SituacaoAnimal;
import com.agrovisionai.agrovision_ai.domain.enums.StatusCapacidadeConfinamento;
import com.agrovisionai.agrovision_ai.domain.enums.TipoAreaManejo;
import com.agrovisionai.agrovision_ai.exception.BusinessException;
import com.agrovisionai.agrovision_ai.exception.ResouceNotFoundException;
import com.agrovisionai.agrovision_ai.repository.AnimalRepository;
import com.agrovisionai.agrovision_ai.repository.AreaManejoRepository;
import com.agrovisionai.agrovision_ai.repository.FazendaGeopoligonoRepository;
import com.agrovisionai.agrovision_ai.repository.RebanhoRepository;
import org.locationtech.jts.geom.Polygon;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class AreaManejoService {

    private static final double PESO_UNIDADE_ANIMAL_KG = 450.0;

    private final AreaManejoRepository areaManejoRepository;
    private final FazendaGeopoligonoRepository fazendaGeopoligonoRepository;
    private final RebanhoRepository rebanhoRepository;
    private final AnimalRepository animalRepository;
    private final FazendaAccessService fazendaAccessService;
    private final GeometriaRuralService geometriaRuralService;

    public AreaManejoService(
            AreaManejoRepository areaManejoRepository,
            FazendaGeopoligonoRepository fazendaGeopoligonoRepository,
            RebanhoRepository rebanhoRepository,
            AnimalRepository animalRepository,
            FazendaAccessService fazendaAccessService,
            GeometriaRuralService geometriaRuralService
    ) {
        this.areaManejoRepository = areaManejoRepository;
        this.fazendaGeopoligonoRepository = fazendaGeopoligonoRepository;
        this.rebanhoRepository = rebanhoRepository;
        this.animalRepository = animalRepository;
        this.fazendaAccessService = fazendaAccessService;
        this.geometriaRuralService = geometriaRuralService;
    }

    @Transactional
    public AreaManejoResponseDTO cadastrar(
            UUID fazendaId,
            AreaManejoRequestDTO dto
    ) {

        Fazenda fazenda =
                fazendaAccessService.exigirProprietario(
                        fazendaId
                );

        validarNomeNovo(
                fazendaId,
                dto.nome()
        );

        FazendaGeopoligono limite =
                buscarLimiteFazenda(
                        fazendaId
                );

        Polygon geometria =
                geometriaRuralService.converterParaPolygon(
                        dto.geometry(),
                        "A área de manejo"
                );

        validarGeometria(
                fazendaId,
                null,
                limite,
                geometria
        );

        Rebanho rebanho =
                validarEObterRebanho(
                        fazendaId,
                        dto.rebanhoId(),
                        null
                );

        AreaManejo area =
                new AreaManejo();

        preencher(
                area,
                fazenda,
                dto,
                geometria,
                rebanho,
                true
        );

        return toResponse(
                areaManejoRepository.save(
                        area
                )
        );
    }

    @Transactional(readOnly = true)
    public ResumoAreasManejoResponseDTO listarResumo(
            UUID fazendaId
    ) {

        fazendaAccessService.exigirVisualizacao(
                fazendaId
        );

        FazendaGeopoligono limite =
                buscarLimiteFazenda(
                        fazendaId
                );

        List<AreaManejo> areas =
                areaManejoRepository
                        .findByFazendaIdOrderByNomeAsc(
                                fazendaId
                        );

        List<AreaManejoResponseDTO> respostas =
                areas
                        .stream()
                        .map(this::toResponse)
                        .toList();

        double areaMapeada =
                areas
                        .stream()
                        .map(AreaManejo::getAreaCalculadaHa)
                        .filter(Objects::nonNull)
                        .mapToDouble(Double::doubleValue)
                        .sum();

        double areaPasto =
                areas
                        .stream()
                        .filter(area ->
                                area.getTipo() ==
                                        TipoAreaManejo.PASTO
                        )
                        .mapToDouble(
                                AreaManejo::getAreaCalculadaHa
                        )
                        .sum();

        double areaConfinamento =
                areas
                        .stream()
                        .filter(area ->
                                area.getTipo() ==
                                        TipoAreaManejo.CONFINAMENTO
                        )
                        .mapToDouble(
                                AreaManejo::getAreaCalculadaHa
                        )
                        .sum();

        long rebanhosAssociados =
                areas
                        .stream()
                        .filter(area ->
                                area.getRebanho() != null
                        )
                        .count();

        long totalRebanhos =
                rebanhoRepository
                        .countByFazendaId(
                                fazendaId
                        );

        long animaisAtivosEmAreas =
                respostas
                        .stream()
                        .map(AreaManejoResponseDTO::indicadores)
                        .mapToLong(
                                IndicadoresAreaManejoDTO::animaisAtivos
                        )
                        .sum();

        double areaFazenda =
                limite.getAreaCalculadaHa();

        double areaLivre =
                Math.max(
                        0.0,
                        areaFazenda - areaMapeada
                );

        double percentualMapeado =
                areaFazenda <= 0
                        ? 0.0
                        : areaMapeada /
                                areaFazenda *
                                100.0;

        return new ResumoAreasManejoResponseDTO(
                fazendaId,
                arredondar(areaFazenda),
                arredondar(areaMapeada),
                arredondar(areaLivre),
                arredondar(percentualMapeado),
                areas.size(),
                areas
                        .stream()
                        .filter(area ->
                                area.getTipo() ==
                                        TipoAreaManejo.PASTO
                        )
                        .count(),
                areas
                        .stream()
                        .filter(area ->
                                area.getTipo() ==
                                        TipoAreaManejo.CONFINAMENTO
                        )
                        .count(),
                arredondar(areaPasto),
                arredondar(areaConfinamento),
                rebanhosAssociados,
                Math.max(
                        0,
                        totalRebanhos -
                                rebanhosAssociados
                ),
                animaisAtivosEmAreas,
                respostas
        );
    }

    @Transactional(readOnly = true)
    public AreaManejoResponseDTO buscarPorId(
            UUID areaId
    ) {

        AreaManejo area =
                buscarArea(
                        areaId
                );

        fazendaAccessService.exigirVisualizacao(
                area.getFazenda().getId()
        );

        return toResponse(
                area
        );
    }

    @Transactional
    public AreaManejoResponseDTO atualizar(
            UUID areaId,
            AreaManejoRequestDTO dto
    ) {

        AreaManejo area =
                buscarArea(
                        areaId
                );

        UUID fazendaId =
                area.getFazenda().getId();

        fazendaAccessService.exigirProprietario(
                fazendaId
        );

        validarNomeAtualizacao(
                fazendaId,
                areaId,
                dto.nome()
        );

        FazendaGeopoligono limite =
                buscarLimiteFazenda(
                        fazendaId
                );

        Polygon geometria =
                geometriaRuralService.converterParaPolygon(
                        dto.geometry(),
                        "A área de manejo"
                );

        validarGeometria(
                fazendaId,
                areaId,
                limite,
                geometria
        );

        Rebanho rebanho =
                validarEObterRebanho(
                        fazendaId,
                        dto.rebanhoId(),
                        areaId
                );

        preencher(
                area,
                area.getFazenda(),
                dto,
                geometria,
                rebanho,
                false
        );

        return toResponse(
                area
        );
    }

    @Transactional
    public AreaManejoResponseDTO associarRebanho(
            UUID areaId,
            AssociarRebanhoAreaRequestDTO dto
    ) {

        AreaManejo area =
                buscarArea(
                        areaId
                );

        UUID fazendaId =
                area.getFazenda().getId();

        fazendaAccessService.exigirProprietario(
                fazendaId
        );

        Rebanho rebanho =
                validarEObterRebanho(
                        fazendaId,
                        dto.rebanhoId(),
                        areaId
                );

        area.setRebanho(
                rebanho
        );

        area.setAtualizadoEm(
                LocalDateTime.now()
        );

        return toResponse(
                area
        );
    }

    @Transactional
    public void deletar(
            UUID areaId
    ) {

        AreaManejo area =
                buscarArea(
                        areaId
                );

        fazendaAccessService.exigirProprietario(
                area.getFazenda().getId()
        );

        areaManejoRepository.delete(
                area
        );
    }

    private void preencher(
            AreaManejo area,
            Fazenda fazenda,
            AreaManejoRequestDTO dto,
            Polygon geometria,
            Rebanho rebanho,
            boolean criacao
    ) {

        String nome =
                dto.nome() == null
                        ? ""
                        : dto.nome().trim();

        if (nome.isBlank()) {
            throw new BusinessException(
                    "Nome da área é obrigatório."
            );
        }

        double areaHa =
                geometriaRuralService
                        .calcularAreaHa(
                                dto.geometry()
                        );

        if (
                !Double.isFinite(areaHa) ||
                areaHa <= 0
        ) {
            throw new BusinessException(
                    "A área desenhada precisa ser maior que zero."
            );
        }

        Integer capacidade =
                validarCapacidade(
                        dto.tipo(),
                        dto.capacidadeMaximaCabecas()
                );

        area.setFazenda(
                fazenda
        );

        area.setNome(
                nome
        );

        area.setDescricao(
                dto.descricao() == null ||
                        dto.descricao().isBlank()
                        ? null
                        : dto.descricao().trim()
        );

        area.setTipo(
                dto.tipo()
        );

        area.setGeometria(
                geometria
        );

        area.setAreaCalculadaHa(
                arredondar(
                        areaHa
                )
        );

        area.setCapacidadeMaximaCabecas(
                capacidade
        );

        area.setRebanho(
                rebanho
        );

        LocalDateTime agora =
                LocalDateTime.now();

        if (criacao) {
            area.setCriadoEm(
                    agora
            );
        }

        area.setAtualizadoEm(
                agora
        );
    }

    private Integer validarCapacidade(
            TipoAreaManejo tipo,
            Integer capacidade
    ) {

        if (
                tipo ==
                        TipoAreaManejo.PASTO
        ) {
            return null;
        }

        if (
                capacidade != null &&
                capacidade <= 0
        ) {
            throw new BusinessException(
                    "A capacidade do confinamento deve ser maior que zero."
            );
        }

        return capacidade;
    }

    private void validarGeometria(
            UUID fazendaId,
            UUID areaIgnoradaId,
            FazendaGeopoligono limite,
            Polygon geometria
    ) {

        if (
                !geometriaRuralService
                        .estaContido(
                                limite.getGeometria(),
                                geometria
                        )
        ) {
            throw new BusinessException(
                    "A área de manejo precisa ficar totalmente dentro do limite da fazenda."
            );
        }

        List<AreaManejo> existentes =
                areaManejoRepository
                        .findByFazendaIdOrderByNomeAsc(
                                fazendaId
                        );

        for (AreaManejo existente : existentes) {

            if (
                    areaIgnoradaId != null &&
                    existente.getId()
                            .equals(areaIgnoradaId)
            ) {
                continue;
            }

            if (
                    geometriaRuralService
                            .possuiSobreposicaoReal(
                                    existente.getGeometria(),
                                    geometria
                            )
            ) {
                throw new BusinessException(
                        "A área desenhada se sobrepõe à área '" +
                                existente.getNome() +
                                "'. Ajuste os limites antes de salvar."
                );
            }
        }
    }

    private Rebanho validarEObterRebanho(
            UUID fazendaId,
            UUID rebanhoId,
            UUID areaAtualId
    ) {

        if (rebanhoId == null) {
            return null;
        }

        Rebanho rebanho =
                rebanhoRepository
                        .findByIdAndFazendaId(
                                rebanhoId,
                                fazendaId
                        )
                        .orElseThrow(() ->
                                new BusinessException(
                                        "O rebanho informado não pertence a esta fazenda."
                                )
                        );

        areaManejoRepository
                .findByRebanhoId(
                        rebanhoId
                )
                .ifPresent(areaExistente -> {

                    if (
                            areaAtualId == null ||
                            !areaExistente
                                    .getId()
                                    .equals(areaAtualId)
                    ) {
                        throw new BusinessException(
                                "Este rebanho já está associado à área '" +
                                        areaExistente.getNome() +
                                        "'."
                        );
                    }
                });

        return rebanho;
    }

    private IndicadoresAreaManejoDTO calcularIndicadores(
            AreaManejo area
    ) {

        Rebanho rebanho =
                area.getRebanho();

        List<Animal> ativos =
                rebanho == null
                        ? List.of()
                        : animalRepository
                                .findByRebanhoId(
                                        rebanho.getId()
                                )
                                .stream()
                                .filter(animal ->
                                        animal.getSituacao() ==
                                                SituacaoAnimal.ATIVO
                                )
                                .toList();

        long quantidade =
                ativos.size();

        double pesoTotal =
                ativos
                        .stream()
                        .mapToDouble(
                                Animal::getPesoAtual
                        )
                        .sum();

        Double pesoMedio =
                quantidade == 0
                        ? null
                        : pesoTotal /
                                quantidade;

        double unidadesAnimais =
                pesoTotal /
                        PESO_UNIDADE_ANIMAL_KG;

        if (
                area.getTipo() ==
                        TipoAreaManejo.PASTO
        ) {

            double areaHa =
                    area.getAreaCalculadaHa();

            return new IndicadoresAreaManejoDTO(
                    quantidade,
                    arredondar(pesoTotal),
                    pesoMedio == null
                            ? null
                            : arredondar(pesoMedio),
                    arredondar(unidadesAnimais),
                    areaHa <= 0
                            ? null
                            : arredondar(
                                    quantidade /
                                            areaHa
                            ),
                    areaHa <= 0
                            ? null
                            : arredondar(
                                    unidadesAnimais /
                                            areaHa
                            ),
                    areaHa <= 0
                            ? null
                            : arredondar(
                                    pesoTotal /
                                            areaHa
                            ),
                    null,
                    null,
                    null,
                    null,
                    null,
                    null
            );
        }

        double areaM2 =
                area.getAreaCalculadaHa() *
                        10_000.0;

        Double metrosQuadradosPorCabeca =
                quantidade == 0
                        ? null
                        : areaM2 /
                                quantidade;

        Integer capacidade =
                area.getCapacidadeMaximaCabecas();

        Double ocupacaoPercentual =
                capacidade == null
                        ? null
                        : capacidade == 0
                                ? null
                                : quantidade *
                                        100.0 /
                                        capacidade;

        Integer vagas =
                capacidade == null
                        ? null
                        : Math.max(
                                0,
                                capacidade -
                                        (int) quantidade
                        );

        Integer excedente =
                capacidade == null
                        ? null
                        : Math.max(
                                0,
                                (int) quantidade -
                                        capacidade
                        );

        StatusCapacidadeConfinamento status =
                statusConfinamento(
                        quantidade,
                        capacidade
                );

        return new IndicadoresAreaManejoDTO(
                quantidade,
                arredondar(pesoTotal),
                pesoMedio == null
                        ? null
                        : arredondar(pesoMedio),
                arredondar(unidadesAnimais),
                null,
                null,
                null,
                metrosQuadradosPorCabeca == null
                        ? null
                        : arredondar(
                                metrosQuadradosPorCabeca
                        ),
                capacidade,
                ocupacaoPercentual == null
                        ? null
                        : arredondar(
                                ocupacaoPercentual
                        ),
                vagas,
                excedente,
                status
        );
    }

    private StatusCapacidadeConfinamento statusConfinamento(
            long quantidade,
            Integer capacidade
    ) {

        if (capacidade == null) {
            return StatusCapacidadeConfinamento
                    .SEM_CAPACIDADE_INFORMADA;
        }

        if (quantidade == 0) {
            return StatusCapacidadeConfinamento
                    .VAZIO;
        }

        if (quantidade > capacidade) {
            return StatusCapacidadeConfinamento
                    .ACIMA_CAPACIDADE;
        }

        if (quantidade == capacidade) {
            return StatusCapacidadeConfinamento
                    .LOTADO;
        }

        return StatusCapacidadeConfinamento
                .DISPONIVEL;
    }

    private AreaManejoResponseDTO toResponse(
            AreaManejo area
    ) {

        Rebanho rebanho =
                area.getRebanho();

        return new AreaManejoResponseDTO(
                area.getId(),
                area.getFazenda().getId(),
                area.getNome(),
                area.getDescricao(),
                area.getTipo(),
                geometriaRuralService
                        .converterParaGeoJson(
                                area.getGeometria()
                        ),
                area.getAreaCalculadaHa(),
                rebanho == null
                        ? null
                        : rebanho.getId(),
                rebanho == null
                        ? null
                        : rebanho.getNome(),
                calcularIndicadores(
                        area
                ),
                area.getCriadoEm(),
                area.getAtualizadoEm()
        );
    }

    private FazendaGeopoligono buscarLimiteFazenda(
            UUID fazendaId
    ) {

        return fazendaGeopoligonoRepository
                .findByFazendaId(
                        fazendaId
                )
                .orElseThrow(() ->
                        new BusinessException(
                                "Delimite primeiro a área total da fazenda antes de criar piquetes."
                        )
                );
    }

    private AreaManejo buscarArea(
            UUID areaId
    ) {

        return areaManejoRepository
                .findById(
                        areaId
                )
                .orElseThrow(() ->
                        new ResouceNotFoundException(
                                "Área de manejo não encontrada."
                        )
                );
    }

    private void validarNomeNovo(
            UUID fazendaId,
            String nome
    ) {

        if (
                nome != null &&
                areaManejoRepository
                        .existsByFazendaIdAndNomeIgnoreCase(
                                fazendaId,
                                nome.trim()
                        )
        ) {
            throw new BusinessException(
                    "Já existe uma área com este nome nesta fazenda."
            );
        }
    }

    private void validarNomeAtualizacao(
            UUID fazendaId,
            UUID areaId,
            String nome
    ) {

        if (
                nome != null &&
                areaManejoRepository
                        .existsByFazendaIdAndNomeIgnoreCaseAndIdNot(
                                fazendaId,
                                nome.trim(),
                                areaId
                        )
        ) {
            throw new BusinessException(
                    "Já existe uma área com este nome nesta fazenda."
            );
        }
    }

    private double arredondar(
            double valor
    ) {

        return Math.round(
                valor * 100.0
        ) / 100.0;
    }
}
