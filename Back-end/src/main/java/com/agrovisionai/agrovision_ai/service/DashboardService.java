package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.domain.dto.response.DashboardEvolucaoPesoDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.DashboardRebanhoDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.DashboardResponseDTO;

import com.agrovisionai.agrovision_ai.domain.enums.SituacaoAnimal;

import com.agrovisionai.agrovision_ai.repository.AnimalRepository;
import com.agrovisionai.agrovision_ai.repository.RebanhoRepository;
import com.agrovisionai.agrovision_ai.repository.RegistroPesoRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;

import java.util.List;
import java.util.UUID;


@Service
@Transactional(readOnly = true)
public class DashboardService {


    private final AnimalRepository animalRepository;

    private final RebanhoRepository rebanhoRepository;

    private final RegistroPesoRepository registroPesoRepository;

    private final FazendaAccessService fazendaAccessService;


    public DashboardService(
            AnimalRepository animalRepository,
            RebanhoRepository rebanhoRepository,
            RegistroPesoRepository registroPesoRepository,
            FazendaAccessService fazendaAccessService
    ) {

        this.animalRepository =
                animalRepository;

        this.rebanhoRepository =
                rebanhoRepository;

        this.registroPesoRepository =
                registroPesoRepository;

        this.fazendaAccessService =
                fazendaAccessService;
    }

    public DashboardResponseDTO buscarPorFazenda(
            UUID fazendaId
    ) {

        fazendaAccessService.exigirVisualizacao(
                fazendaId
        );


        long totalAnimais =
                animalRepository
                        .countByRebanhoFazendaId(
                                fazendaId
                        );


        long animaisAtivos =
                animalRepository
                        .countByRebanhoFazendaIdAndSituacao(
                                fazendaId,
                                SituacaoAnimal.ATIVO
                        );


        long animaisInativos =
                animalRepository
                        .countByRebanhoFazendaIdAndSituacao(
                                fazendaId,
                                SituacaoAnimal.INATIVO
                        );


        long animaisVendidos =
                animalRepository
                        .countByRebanhoFazendaIdAndSituacao(
                                fazendaId,
                                SituacaoAnimal.VENDIDO
                        );


        long animaisMortos =
                animalRepository
                        .countByRebanhoFazendaIdAndSituacao(
                                fazendaId,
                                SituacaoAnimal.MORTO
                        );

        long totalRebanhos =
                rebanhoRepository
                        .countByFazendaId(
                                fazendaId
                        );


        long totalPesagens =
                registroPesoRepository
                        .countByAnimalRebanhoFazendaId(
                                fazendaId
                        );


        Double pesoMedio =
                animalRepository
                        .buscarPesoMedioAtual(
                                fazendaId,
                                SituacaoAnimal.ATIVO
                        );


        double pesoMedioAtual =
                pesoMedio != null
                        ? arredondar(
                        pesoMedio
                )
                        : 0.0;


        LocalDateTime ultimaPesagem =
                registroPesoRepository
                        .buscarUltimaPesagem(
                                fazendaId
                        );


        List<DashboardRebanhoDTO> rebanhos =
                buscarResumoRebanhos(
                        fazendaId
                );


        List<DashboardEvolucaoPesoDTO> evolucaoPeso =
                buscarEvolucaoPeso(
                        fazendaId
                );


        return new DashboardResponseDTO(

                fazendaId,

                totalAnimais,

                animaisAtivos,

                animaisInativos,

                animaisVendidos,

                animaisMortos,

                totalRebanhos,

                totalPesagens,

                pesoMedioAtual,

                ultimaPesagem,

                rebanhos,

                evolucaoPeso
        );
    }


    private List<DashboardRebanhoDTO> buscarResumoRebanhos(
            UUID fazendaId
    ) {

        List<Object[]> resultado =
                rebanhoRepository
                        .buscarResumoDashboard(
                                fazendaId,
                                SituacaoAnimal.ATIVO
                        );


        return resultado
                .stream()

                .map(linha -> {

                    UUID rebanhoId =
                            (UUID) linha[0];


                    String nome =
                            (String) linha[1];


                    long quantidadeAnimais =
                            linha[2] != null
                                    ? ((Number) linha[2])
                                    .longValue()
                                    : 0L;


                    long animaisAtivos =
                            linha[3] != null
                                    ? ((Number) linha[3])
                                    .longValue()
                                    : 0L;


                    double pesoMedio =
                            linha[4] != null
                                    ? arredondar(
                                    ((Number) linha[4])
                                            .doubleValue()
                            )
                                    : 0.0;


                    return new DashboardRebanhoDTO(

                            rebanhoId,

                            nome,

                            quantidadeAnimais,

                            animaisAtivos,

                            pesoMedio
                    );

                })

                .toList();
    }


    private List<DashboardEvolucaoPesoDTO> buscarEvolucaoPeso(
            UUID fazendaId
    ) {

        LocalDateTime inicio =
                YearMonth
                        .now()
                        .minusMonths(5)
                        .atDay(1)
                        .atStartOfDay();


        List<Object[]> resultado =
                registroPesoRepository
                        .buscarEvolucaoPeso(
                                fazendaId,
                                inicio
                        );


        return resultado
                .stream()

                .map(linha -> {

                    int ano =
                            ((Number) linha[0])
                                    .intValue();


                    int mes =
                            ((Number) linha[1])
                                    .intValue();


                    double pesoMedio =
                            linha[2] != null
                                    ? arredondar(
                                    ((Number) linha[2])
                                            .doubleValue()
                            )
                                    : 0.0;


                    String periodo =
                            YearMonth
                                    .of(
                                            ano,
                                            mes
                                    )
                                    .toString();


                    return new DashboardEvolucaoPesoDTO(

                            periodo,

                            pesoMedio
                    );

                })

                .toList();
    }


    private double arredondar(
            double valor
    ) {

        return Math.round(
                valor * 100.0
        ) / 100.0;
    }
}