package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.auth.Usuario;
import com.agrovisionai.agrovision_ai.domain.entity.*;
import com.agrovisionai.agrovision_ai.domain.enums.*;
import com.agrovisionai.agrovision_ai.exception.UnauthorizedException;
import com.agrovisionai.agrovision_ai.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class DesempenhoAlertasTest {
    private final AnimalRepository animais = mock(AnimalRepository.class);
    private final RebanhoRepository rebanhos = mock(RebanhoRepository.class);
    private final RegistroPesoRepository pesos = mock(RegistroPesoRepository.class);
    private final FazendaAccessService acesso = mock(FazendaAccessService.class);
    private final DesempenhoService service = new DesempenhoService(animais, rebanhos, pesos, acesso);
    private final UUID fazendaId = UUID.randomUUID();
    private Animal animal;
    private final LocalDateTime agora = LocalDateTime.now().minusMinutes(1);

    @BeforeEach
    void preparar() {
        ReflectionTestUtils.setField(service, "gmdMinimoAlerta", 0.50);
        ReflectionTestUtils.setField(service, "gmdEstavelLimite", 0.05);
        ReflectionTestUtils.setField(service, "diasSemPesagemAlerta", 45);
        ReflectionTestUtils.setField(service, "projecaoDias", 30);
        Fazenda fazenda = new Fazenda();
        fazenda.setId(fazendaId);
        Rebanho rebanho = new Rebanho("Engorda", null, fazenda);
        ReflectionTestUtils.setField(rebanho, "id", UUID.randomUUID());
        animal = new Animal("B-01", "Nelore", SexoAnimal.MACHO, LocalDate.now().minusYears(2), 400.0, rebanho);
        ReflectionTestUtils.setField(animal, "id", UUID.randomUUID());
        when(animais.findByRebanhoFazendaId(fazendaId)).thenReturn(List.of(animal));
    }

    private RegistroPeso peso(double kg, LocalDateTime data) {
        RegistroPeso registro = new RegistroPeso(animal, new Usuario(), kg);
        ReflectionTestUtils.setField(registro, "dataRegistro", data);
        return registro;
    }

    private void historico(RegistroPeso... registros) {
        when(pesos.findByAnimalRebanhoFazendaIdOrderByDataRegistroDesc(fazendaId)).thenReturn(List.of(registros));
    }

    @Test
    void pequenaPerdaContinuaGraveMesmoSeGmdArredondarParaZero() {
        historico(peso(399.99, agora), peso(400, agora.minusDays(30)));
        var alertas = service.buscarAlertasPorFazenda(fazendaId).alertas();
        assertEquals(1, alertas.size());
        assertEquals(TipoAlertaDesempenho.PERDA_PESO, alertas.getFirst().tipo());
        assertEquals(SeveridadeAlertaDesempenho.CRITICO, alertas.getFirst().severidade());
        assertTrue(alertas.getFirst().mensagem().contains("0,01 kg"));
    }

    @Test
    void ganhoAbaixoDaReferenciaEhMedio() {
        historico(peso(404, agora), peso(400, agora.minusDays(10)));
        var alertas = service.buscarAlertasPorFazenda(fazendaId).alertas();
        assertEquals(1, alertas.size());
        assertEquals(TipoAlertaDesempenho.GMD_BAIXO, alertas.getFirst().tipo());
        assertEquals(SeveridadeAlertaDesempenho.ATENCAO, alertas.getFirst().severidade());
    }

    @Test
    void limiteUsaPrecisaoAntesDeArredondar() {
        historico(peso(404.99, agora), peso(400, agora.minusDays(10)));
        assertEquals(TipoAlertaDesempenho.GMD_BAIXO, service.buscarAlertasPorFazenda(fazendaId).alertas().getFirst().tipo());
        historico(peso(405, agora), peso(400, agora.minusDays(10)));
        assertTrue(service.buscarAlertasPorFazenda(fazendaId).alertas().isEmpty());
    }

    @Test
    void mesmoInstanteGeraInformativoSemGmdOuPerda() {
        historico(peso(390, agora), peso(400, agora));
        var alertas = service.buscarAlertasPorFazenda(fazendaId).alertas();
        assertEquals(1, alertas.size());
        assertEquals(TipoAlertaDesempenho.DADOS_INSUFICIENTES, alertas.getFirst().tipo());
    }

    @Test
    void semPesagensTambemEhInformativo() {
        historico();
        assertEquals(TipoAlertaDesempenho.DADOS_INSUFICIENTES, service.buscarAlertasPorFazenda(fazendaId).alertas().getFirst().tipo());
    }

    @Test
    void atrasoNoLimiteGeraMedioEGravesVemPrimeiro() {
        historico(peso(390, agora.minusDays(45)), peso(400, agora.minusDays(60)));
        var alertas = service.buscarAlertasPorFazenda(fazendaId).alertas();
        assertEquals(2, alertas.size());
        assertEquals(TipoAlertaDesempenho.PERDA_PESO, alertas.getFirst().tipo());
        assertEquals(TipoAlertaDesempenho.SEM_PESAGEM_RECENTE, alertas.get(1).tipo());
    }

    @Test
    void atualizaCondicaoSemAcumularMensagensEIgnoraInativos() {
        historico(peso(390, agora), peso(400, agora.minusDays(10)));
        assertEquals(1, service.buscarAlertasPorFazenda(fazendaId).alertas().size());
        historico(peso(410, agora), peso(400, agora.minusDays(10)));
        assertTrue(service.buscarAlertasPorFazenda(fazendaId).alertas().isEmpty());
        animal.inativar();
        var resumo = service.buscarAlertasPorFazenda(fazendaId);
        assertEquals(0, resumo.animaisAtivos());
        assertTrue(resumo.alertas().isEmpty());
    }

    @Test
    void naoConsultaDadosSemAcessoAFazenda() {
        doThrow(new UnauthorizedException("Sem acesso")).when(acesso).exigirVisualizacao(fazendaId);
        assertThrows(UnauthorizedException.class, () -> service.buscarAlertasPorFazenda(fazendaId));
        verifyNoInteractions(pesos, rebanhos);
        verify(animais, never()).findByRebanhoFazendaId(any());
    }
}
