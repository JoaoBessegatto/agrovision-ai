package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.domain.dto.response.AlertaDesempenhoResponseDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.CentralAlertasResponseDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.DesempenhoAnimalResponseDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.DesempenhoFazendaResponseDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.DesempenhoRebanhoResponseDTO;
import com.agrovisionai.agrovision_ai.domain.entity.Animal;
import com.agrovisionai.agrovision_ai.domain.entity.Rebanho;
import com.agrovisionai.agrovision_ai.domain.entity.RegistroPeso;
import com.agrovisionai.agrovision_ai.domain.enums.SeveridadeAlertaDesempenho;
import com.agrovisionai.agrovision_ai.domain.enums.SituacaoAnimal;
import com.agrovisionai.agrovision_ai.domain.enums.TendenciaDesempenho;
import com.agrovisionai.agrovision_ai.domain.enums.TipoAlertaDesempenho;
import com.agrovisionai.agrovision_ai.exception.ResouceNotFoundException;
import com.agrovisionai.agrovision_ai.repository.AnimalRepository;
import com.agrovisionai.agrovision_ai.repository.RebanhoRepository;
import com.agrovisionai.agrovision_ai.repository.RegistroPesoRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class DesempenhoService {

    private final AnimalRepository animalRepository;
    private final RebanhoRepository rebanhoRepository;
    private final RegistroPesoRepository registroPesoRepository;
    private final FazendaAccessService fazendaAccessService;

    @Value("${app.desempenho.gmd-minimo-alerta:0.50}")
    private double gmdMinimoAlerta;

    @Value("${app.desempenho.gmd-estavel-limite:0.05}")
    private double gmdEstavelLimite;

    @Value("${app.desempenho.dias-sem-pesagem-alerta:45}")
    private int diasSemPesagemAlerta;

    @Value("${app.desempenho.projecao-dias:30}")
    private int projecaoDias;

    @Value("${app.desempenho.ranking-limite:5}")
    private int rankingLimite;

    public DesempenhoService(
            AnimalRepository animalRepository,
            RebanhoRepository rebanhoRepository,
            RegistroPesoRepository registroPesoRepository,
            FazendaAccessService fazendaAccessService
    ) {
        this.animalRepository = animalRepository;
        this.rebanhoRepository = rebanhoRepository;
        this.registroPesoRepository = registroPesoRepository;
        this.fazendaAccessService = fazendaAccessService;
    }

    public DesempenhoFazendaResponseDTO buscarPorFazenda(UUID fazendaId) {

        List<DesempenhoAnimalResponseDTO> desempenhos = consultarAnimaisAtivos(fazendaId);

        long animaisComGmd = desempenhos
                .stream()
                .filter(DesempenhoAnimalResponseDTO::dadosSuficientes)
                .count();

        long animaisSemDados =
                desempenhos.size() - animaisComGmd;

        long animaisEmGanho = contarTendencia(
                desempenhos,
                TendenciaDesempenho.GANHO
        );

        long animaisEstaveis = contarTendencia(
                desempenhos,
                TendenciaDesempenho.ESTAVEL
        );

        long animaisEmPerda = contarTendencia(
                desempenhos,
                TendenciaDesempenho.PERDA
        );

        Double gmdMedio =
                media(
                        desempenhos
                                .stream()
                                .map(DesempenhoAnimalResponseDTO::gmdKgDia)
                                .filter(Objects::nonNull)
                                .toList()
                );

        Double pesoMedioAtual =
                media(
                        desempenhos
                                .stream()
                                .map(DesempenhoAnimalResponseDTO::pesoAtualKg)
                                .filter(Objects::nonNull)
                                .toList()
                );

        Double pesoProjetado30Dias =
                projetarPeso(
                        pesoMedioAtual,
                        gmdMedio,
                        30
                );

        Double pesoProjetado60Dias =
                projetarPeso(
                        pesoMedioAtual,
                        gmdMedio,
                        60
                );

        Double pesoProjetado90Dias =
                projetarPeso(
                        pesoMedioAtual,
                        gmdMedio,
                        90
                );

        double cobertura =
                desempenhos.isEmpty()
                        ? 0.0
                        : arredondar(
                                animaisComGmd * 100.0 /
                                        desempenhos.size()
                        );

        List<DesempenhoRebanhoResponseDTO> rebanhos =
                rebanhoRepository
                        .findByFazendaIdOrderByNomeAsc(fazendaId)
                        .stream()
                        .map(rebanho ->
                                resumirRebanho(
                                        rebanho,
                                        desempenhos
                                                .stream()
                                                .filter(item ->
                                                        item.rebanhoId()
                                                                .equals(rebanho.getId())
                                                )
                                                .toList()
                                )
                        )
                        .toList();

        List<DesempenhoAnimalResponseDTO> rankingMelhores =
                desempenhos
                        .stream()
                        .filter(item -> item.gmdKgDia() != null)
                        .sorted(
                                Comparator.comparing(
                                        DesempenhoAnimalResponseDTO::gmdKgDia
                                ).reversed()
                        )
                        .limit(rankingLimite)
                        .toList();

        List<DesempenhoAnimalResponseDTO> rankingAtencao =
                desempenhos
                        .stream()
                        .filter(item -> item.gmdKgDia() != null)
                        .sorted(
                                Comparator.comparing(
                                        DesempenhoAnimalResponseDTO::gmdKgDia
                                )
                        )
                        .limit(rankingLimite)
                        .toList();

        List<AlertaDesempenhoResponseDTO> alertas =
                desempenhos
                        .stream()
                        .flatMap(item -> item.alertas().stream())
                        .sorted(
                                Comparator
                                        .comparingInt(
                                                (AlertaDesempenhoResponseDTO alerta) ->
                                                        alerta.severidade().ordinal()
                                        )
                                        .reversed()
                                        .thenComparing(
                                                AlertaDesempenhoResponseDTO::identificacaoAnimal
                                        )
                        )
                        .toList();

        int alertasCriticos =
                (int) alertas
                        .stream()
                        .filter(alerta ->
                                alerta.severidade() ==
                                        SeveridadeAlertaDesempenho.CRITICO
                        )
                        .count();

        return new DesempenhoFazendaResponseDTO(
                fazendaId,
                desempenhos.size(),
                animaisComGmd,
                animaisSemDados,
                animaisEmGanho,
                animaisEstaveis,
                animaisEmPerda,
                gmdMedio,
                pesoMedioAtual,
                pesoProjetado30Dias,
                pesoProjetado60Dias,
                pesoProjetado90Dias,
                cobertura,
                alertas.size(),
                alertasCriticos,
                arredondar(gmdMinimoAlerta),
                diasSemPesagemAlerta,
                projecaoDias,
                LocalDateTime.now(),
                rebanhos,
                rankingMelhores,
                rankingAtencao,
                alertas
        );
    }

    public CentralAlertasResponseDTO buscarAlertasPorFazenda(UUID fazendaId) {
        List<DesempenhoAnimalResponseDTO> desempenhos = consultarAnimaisAtivos(fazendaId);
        List<AlertaDesempenhoResponseDTO> alertas = desempenhos.stream()
                .flatMap(item -> item.alertas().stream())
                .sorted(Comparator.comparingInt((AlertaDesempenhoResponseDTO a) -> a.severidade().ordinal())
                        .reversed().thenComparing(AlertaDesempenhoResponseDTO::identificacaoAnimal)
                        .thenComparing(a -> a.tipo().name()))
                .toList();
        return new CentralAlertasResponseDTO(fazendaId, desempenhos.size(), LocalDateTime.now(),
                gmdMinimoAlerta, diasSemPesagemAlerta, alertas);
    }

    private List<DesempenhoAnimalResponseDTO> consultarAnimaisAtivos(UUID fazendaId) {
        fazendaAccessService.exigirVisualizacao(fazendaId);

        List<Animal> animaisAtivos = animalRepository
                .findByRebanhoFazendaId(fazendaId)
                .stream()
                .filter(animal -> animal.getSituacao() == SituacaoAnimal.ATIVO)
                .toList();

        Map<UUID, List<RegistroPeso>> historicos =
                agruparHistoricosPorAnimal(
                        registroPesoRepository
                                .findByAnimalRebanhoFazendaIdOrderByDataRegistroDesc(
                                        fazendaId
                                )
                );

        List<DesempenhoAnimalResponseDTO> desempenhos =
                animaisAtivos
                        .stream()
                        .map(animal ->
                                calcularAnimal(
                                        animal,
                                        historicos.getOrDefault(
                                                animal.getId(),
                                                List.of()
                                        ),
                                        true
                                )
                        )
                        .toList();

        return desempenhos;
    }

    public DesempenhoAnimalResponseDTO buscarPorAnimal(UUID animalId) {

        Animal animal = animalRepository
                .findById(animalId)
                .orElseThrow(() ->
                        new ResouceNotFoundException(
                                "Animal não encontrado."
                        )
                );

        fazendaAccessService.exigirVisualizacao(
                animal.getRebanho()
                        .getFazenda()
                        .getId()
        );

        List<RegistroPeso> historico =
                registroPesoRepository
                        .findByAnimalIdOrderByDataRegistroDesc(
                                animalId
                        );

        return calcularAnimal(
                animal,
                historico,
                animal.getSituacao() == SituacaoAnimal.ATIVO
        );
    }

    public DesempenhoRebanhoResponseDTO buscarPorRebanho(UUID rebanhoId) {

        Rebanho rebanho = rebanhoRepository
                .findById(rebanhoId)
                .orElseThrow(() ->
                        new ResouceNotFoundException(
                                "Rebanho não encontrado."
                        )
                );

        UUID fazendaId =
                rebanho.getFazenda().getId();

        fazendaAccessService.exigirVisualizacao(
                fazendaId
        );

        Map<UUID, List<RegistroPeso>> historicos =
                agruparHistoricosPorAnimal(
                        registroPesoRepository
                                .findByAnimalRebanhoFazendaIdOrderByDataRegistroDesc(
                                        fazendaId
                                )
                );

        List<DesempenhoAnimalResponseDTO> desempenhos =
                animalRepository
                        .findByRebanhoId(rebanhoId)
                        .stream()
                        .filter(animal ->
                                animal.getSituacao() ==
                                        SituacaoAnimal.ATIVO
                        )
                        .map(animal ->
                                calcularAnimal(
                                        animal,
                                        historicos.getOrDefault(
                                                animal.getId(),
                                                List.of()
                                        ),
                                        true
                                )
                        )
                        .toList();

        return resumirRebanho(
                rebanho,
                desempenhos
        );
    }

    private DesempenhoAnimalResponseDTO calcularAnimal(
            Animal animal,
            List<RegistroPeso> historico,
            boolean gerarAlertasOperacionais
    ) {

        RegistroPeso atual =
                historico.isEmpty()
                        ? null
                        : historico.get(0);

        RegistroPeso anterior =
                historico.size() < 2
                        ? null
                        : historico.get(1);

        Double ganhoPeso = null;
        Double intervaloDias = null;
        Double gmd = null;
        Double gmdCalculado = null;
        Double projecao = null;

        TendenciaDesempenho tendencia =
                TendenciaDesempenho.SEM_DADOS;

        boolean dadosSuficientes = false;

        if (
                atual != null &&
                anterior != null
        ) {

            double segundos =
                    Duration.between(
                            anterior.getDataRegistro(),
                            atual.getDataRegistro()
                    ).toSeconds();

            double dias =
                    segundos / 86_400.0;

            /*
             * Duas pesagens com o mesmo instante (ou ordem
             * temporal inválida) não formam um intervalo
             * válido para GMD.
             */
            if (dias > 0.0) {

                double variacaoPeso = atual.getPesoKg() - anterior.getPesoKg();
                ganhoPeso = arredondar(variacaoPeso);
                intervaloDias = arredondar(dias);
                // Classificar com precisão total; arredondar apenas para apresentação.
                gmdCalculado = variacaoPeso / dias;
                gmd = arredondar(gmdCalculado);

                dadosSuficientes = true;

                tendencia =
                        classificarTendencia(gmdCalculado);

                projecao =
                        arredondar(
                                Math.max(
                                        0.0,
                                        atual.getPesoKg() +
                                                (gmd * projecaoDias)
                                )
                        );
            }
        }

        Long diasSemPesagem =
                atual == null
                        ? null
                        : Math.max(
                                0L,
                                Duration.between(
                                        atual.getDataRegistro(),
                                        LocalDateTime.now()
                                ).toDays()
                        );

        List<AlertaDesempenhoResponseDTO> alertas =
                gerarAlertas(
                        animal,
                        historico,
                        gmdCalculado,
                        diasSemPesagem,
                        gerarAlertasOperacionais
                );

        return new DesempenhoAnimalResponseDTO(
                animal.getId(),
                animal.getIdentificacao(),
                animal.getRebanho().getId(),
                animal.getRebanho().getNome(),
                atual != null
                        ? arredondar(atual.getPesoKg())
                        : arredondar(animal.getPesoAtual()),
                anterior != null
                        ? arredondar(anterior.getPesoKg())
                        : null,
                atual != null
                        ? atual.getDataRegistro()
                        : null,
                anterior != null
                        ? anterior.getDataRegistro()
                        : null,
                ganhoPeso,
                intervaloDias,
                gmd,
                tendencia,
                projecao,
                projecaoDias,
                diasSemPesagem,
                dadosSuficientes,
                alertas
        );
    }

    private List<AlertaDesempenhoResponseDTO> gerarAlertas(
            Animal animal,
            List<RegistroPeso> historico,
            Double gmd,
            Long diasSemPesagem,
            boolean gerarAlertasOperacionais
    ) {

        if (!gerarAlertasOperacionais) {
            return List.of();
        }

        List<AlertaDesempenhoResponseDTO> alertas =
                new ArrayList<>();

        if (gmd == null) {

            alertas.add(
                    novoAlerta(
                            TipoAlertaDesempenho.DADOS_INSUFICIENTES,
                            SeveridadeAlertaDesempenho.INFO,
                            "Histórico insuficiente",
                            "São necessárias pelo menos duas pesagens em momentos diferentes para calcular o GMD.",
                            animal
                    )
            );
        }

        if (
                diasSemPesagem != null &&
                diasSemPesagem >= diasSemPesagemAlerta
        ) {

            alertas.add(
                    novoAlerta(
                            TipoAlertaDesempenho.SEM_PESAGEM_RECENTE,
                            SeveridadeAlertaDesempenho.ATENCAO,
                            "Pesagem desatualizada",
                            "Este animal está há " +
                                    diasSemPesagem +
                                    " dias sem uma nova pesagem.",
                            animal
                    )
            );
        }

        if (gmd != null) {

            if (gmd < 0.0) {

                alertas.add(
                        novoAlerta(
                                TipoAlertaDesempenho.PERDA_PESO,
                                SeveridadeAlertaDesempenho.CRITICO,
                                "Perda de peso",
                                "O animal perdeu " + formatar(historico.get(1).getPesoKg() - historico.get(0).getPesoKg()) +
                                        " kg entre as duas últimas pesagens (de " + formatar(historico.get(1).getPesoKg()) +
                                        " para " + formatar(historico.get(0).getPesoKg()) +
                                        " kg). Confira os registros e avalie o manejo do animal.",
                                animal
                        )
                );

            } else if (gmd < gmdMinimoAlerta) {

                alertas.add(
                        novoAlerta(
                                TipoAlertaDesempenho.GMD_BAIXO,
                                SeveridadeAlertaDesempenho.ATENCAO,
                                "GMD abaixo do parâmetro",
                                "O GMD atual é " +
                                        formatar(gmd) +
                                        " kg/dia. O parâmetro de atenção está configurado em " +
                                        formatar(gmdMinimoAlerta) +
                                        " kg/dia.",
                                animal
                        )
                );
            }
        }

        return List.copyOf(alertas);
    }

    private AlertaDesempenhoResponseDTO novoAlerta(
            TipoAlertaDesempenho tipo,
            SeveridadeAlertaDesempenho severidade,
            String titulo,
            String mensagem,
            Animal animal
    ) {

        return new AlertaDesempenhoResponseDTO(
                tipo,
                severidade,
                titulo,
                mensagem,
                animal.getId(),
                animal.getIdentificacao(),
                animal.getRebanho().getId(),
                animal.getRebanho().getNome()
        );
    }

    private DesempenhoRebanhoResponseDTO resumirRebanho(
            Rebanho rebanho,
            List<DesempenhoAnimalResponseDTO> desempenhos
    ) {

        List<Double> gmds =
                desempenhos
                        .stream()
                        .map(DesempenhoAnimalResponseDTO::gmdKgDia)
                        .filter(Objects::nonNull)
                        .toList();

        List<Double> pesos =
                desempenhos
                        .stream()
                        .map(DesempenhoAnimalResponseDTO::pesoAtualKg)
                        .filter(Objects::nonNull)
                        .toList();

        long animaisComGmd =
                gmds.size();

        double cobertura =
                desempenhos.isEmpty()
                        ? 0.0
                        : arredondar(
                                animaisComGmd * 100.0 /
                                        desempenhos.size()
                        );

        long animaisEmPerda =
                desempenhos
                        .stream()
                        .filter(item ->
                                item.tendencia() ==
                                        TendenciaDesempenho.PERDA
                        )
                        .count();

        long animaisComGmdBaixo =
                desempenhos
                        .stream()
                        .filter(item ->
                                item.alertas()
                                        .stream()
                                        .anyMatch(alerta ->
                                                alerta.tipo() ==
                                                        TipoAlertaDesempenho.GMD_BAIXO
                                        )
                        )
                        .count();

        long animaisSemPesagemRecente =
                desempenhos
                        .stream()
                        .filter(item ->
                                item.alertas()
                                        .stream()
                                        .anyMatch(alerta ->
                                                alerta.tipo() ==
                                                        TipoAlertaDesempenho.SEM_PESAGEM_RECENTE
                                        )
                        )
                        .count();

        Double melhorGmd =
                gmds
                        .stream()
                        .max(Double::compareTo)
                        .map(this::arredondar)
                        .orElse(null);

        Double piorGmd =
                gmds
                        .stream()
                        .min(Double::compareTo)
                        .map(this::arredondar)
                        .orElse(null);

        Double pesoMedioAtual =
                media(pesos);

        Double gmdMedio =
                media(gmds);

        Double pesoProjetado30Dias =
                projetarPeso(
                        pesoMedioAtual,
                        gmdMedio,
                        30
                );

        Double pesoProjetado60Dias =
                projetarPeso(
                        pesoMedioAtual,
                        gmdMedio,
                        60
                );

        Double pesoProjetado90Dias =
                projetarPeso(
                        pesoMedioAtual,
                        gmdMedio,
                        90
                );

        return new DesempenhoRebanhoResponseDTO(
                rebanho.getId(),
                rebanho.getNome(),
                desempenhos.size(),
                animaisComGmd,
                cobertura,
                pesoMedioAtual,
                gmdMedio,
                pesoProjetado30Dias,
                pesoProjetado60Dias,
                pesoProjetado90Dias,
                melhorGmd,
                piorGmd,
                animaisEmPerda,
                animaisComGmdBaixo,
                animaisSemPesagemRecente
        );
    }

    private Map<UUID, List<RegistroPeso>> agruparHistoricosPorAnimal(
            List<RegistroPeso> registros
    ) {

        return registros
                .stream()
                .collect(
                        Collectors.groupingBy(
                                registro ->
                                        registro.getAnimal().getId(),
                                LinkedHashMap::new,
                                Collectors.toList()
                        )
                );
    }

    private long contarTendencia(
            List<DesempenhoAnimalResponseDTO> desempenhos,
            TendenciaDesempenho tendencia
    ) {

        return desempenhos
                .stream()
                .filter(item ->
                        item.tendencia() == tendencia
                )
                .count();
    }

    private TendenciaDesempenho classificarTendencia(
            double gmd
    ) {

        if (gmd > gmdEstavelLimite) {
            return TendenciaDesempenho.GANHO;
        }

        if (gmd < 0.0) {
            return TendenciaDesempenho.PERDA;
        }

        return TendenciaDesempenho.ESTAVEL;
    }

    private Double projetarPeso(
            Double pesoAtual,
            Double gmd,
            int dias
    ) {

        if (
                pesoAtual == null ||
                gmd == null
        ) {
            return null;
        }

        return arredondar(
                Math.max(
                        0.0,
                        pesoAtual +
                                (
                                        gmd *
                                        dias
                                )
                )
        );
    }


    private Double media(List<Double> valores) {

        if (valores.isEmpty()) {
            return null;
        }

        return arredondar(
                valores
                        .stream()
                        .mapToDouble(Double::doubleValue)
                        .average()
                        .orElse(0.0)
        );
    }

    private double arredondar(double valor) {
        return Math.round(valor * 100.0) / 100.0;
    }

    private String formatar(double valor) {
        return String.format(
                java.util.Locale.forLanguageTag("pt-BR"),
                "%.2f",
                valor
        );
    }
}
