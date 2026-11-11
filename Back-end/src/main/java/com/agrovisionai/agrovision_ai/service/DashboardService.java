package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.auth.CurrentUserProvider;
import com.agrovisionai.agrovision_ai.auth.Usuario;

import com.agrovisionai.agrovision_ai.domain.dto.response.DashboardEvolucaoPesoDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.DashboardRebanhoDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.DashboardResponseDTO;

import com.agrovisionai.agrovision_ai.domain.entity.Fazenda;

import com.agrovisionai.agrovision_ai.domain.enums.SituacaoAnimal;

import com.agrovisionai.agrovision_ai.exception.ResouceNotFoundException;
import com.agrovisionai.agrovision_ai.exception.UnauthorizedException;

import com.agrovisionai.agrovision_ai.repository.AnimalRepository;
import com.agrovisionai.agrovision_ai.repository.FazendaRepository;
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

    private final FazendaRepository fazendaRepository;

    private final CurrentUserProvider currentUserProvider;


    public DashboardService(
            AnimalRepository animalRepository,
            RebanhoRepository rebanhoRepository,
            RegistroPesoRepository registroPesoRepository,
            FazendaRepository fazendaRepository,
            CurrentUserProvider currentUserProvider
    ) {

        this.animalRepository =
                animalRepository;

        this.rebanhoRepository =
                rebanhoRepository;

        this.registroPesoRepository =
                registroPesoRepository;

        this.fazendaRepository =
                fazendaRepository;

        this.currentUserProvider =
                currentUserProvider;
    }


    // =========================================================
    // DASHBOARD DA FAZENDA
    // =========================================================

    public DashboardResponseDTO buscarPorFazenda(
            UUID fazendaId
    ) {

        /*
         * Antes de qualquer cálculo,
         * garante que a fazenda existe
         * e pertence ao usuário atual.
         */
        buscarFazendaAutorizada(
                fazendaId
        );


        // =====================================================
        // ANIMAIS
        // =====================================================

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


        // =====================================================
        // REBANHOS
        // =====================================================

        long totalRebanhos =
                rebanhoRepository
                        .countByFazendaId(
                                fazendaId
                        );


        // =====================================================
        // PESAGENS
        // =====================================================

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


        // =====================================================
        // DISTRIBUIÇÃO POR REBANHO
        // =====================================================

        List<DashboardRebanhoDTO> rebanhos =
                buscarResumoRebanhos(
                        fazendaId
                );


        // =====================================================
        // EVOLUÇÃO DE PESO
        // =====================================================

        List<DashboardEvolucaoPesoDTO> evolucaoPeso =
                buscarEvolucaoPeso(
                        fazendaId
                );


        // =====================================================
        // RESPONSE
        // =====================================================

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


    // =========================================================
    // RESUMO DOS REBANHOS
    // =========================================================

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


    // =========================================================
    // EVOLUÇÃO DO PESO
    // =========================================================

    private List<DashboardEvolucaoPesoDTO> buscarEvolucaoPeso(
            UUID fazendaId
    ) {

        /*
         * Inclui o mês atual + cinco
         * meses anteriores.
         */
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


    // =========================================================
    // AUTORIZAÇÃO
    // =========================================================

    private Fazenda buscarFazendaAutorizada(
            UUID fazendaId
    ) {

        Fazenda fazenda =
                fazendaRepository
                        .findById(
                                fazendaId
                        )

                        .orElseThrow(() ->
                                new ResouceNotFoundException(
                                        "Fazenda não encontrada."
                                )
                        );


        Usuario usuario =
                currentUserProvider
                        .getUsuarioAtual();


        if (
                !fazenda
                        .getProdutor()
                        .getUsuario()
                        .getId()
                        .equals(
                                usuario.getId()
                        )
        ) {

            throw new UnauthorizedException(
                    "Usuário não possui acesso a esta fazenda."
            );
        }


        return fazenda;
    }


    // =========================================================
    // ARREDONDAMENTO
    // =========================================================

    private double arredondar(
            double valor
    ) {

        return Math.round(
                valor * 100.0
        ) / 100.0;
    }
}