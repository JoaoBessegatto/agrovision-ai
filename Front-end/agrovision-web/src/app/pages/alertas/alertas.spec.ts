import { signal } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { Alertas } from './alertas';
import { FazendaContextService } from '../../core/fazenda/services/fazenda-context.service';
import { CentralAlertas } from '../../core/desempenho/services/alerta.service';

registerLocaleData(localePt, 'pt-BR');

describe('Central de alertas', () => {
  const fazendaId = signal<string | null>('a');
  let http: HttpTestingController;
  let fixture: ComponentFixture<Alertas>;
  const url = (id = 'a') => `http://localhost:8080/api/alertas/fazenda/${id}`;
  const resumo = (): CentralAlertas => ({
    fazendaId: 'a', animaisAtivos: 4, calculadoEm: '2026-11-23T16:00:00',
    gmdMinimoAlertaKgDia: 0.5, diasSemPesagemAlerta: 45,
    alertas: [
      { tipo: 'GMD_BAIXO', severidade: 'ATENCAO', titulo: 'Ganho baixo', mensagem: 'Abaixo da referência', animalId: '2', identificacaoAnimal: 'B-02', rebanhoId: 'r2', rebanhoNome: 'Recria' },
      { tipo: 'PERDA_PESO', severidade: 'CRITICO', titulo: 'Perda de peso', mensagem: 'Perdeu 5 kg', animalId: '1', identificacaoAnimal: 'B-01', rebanhoId: 'r1', rebanhoNome: 'São João' },
      { tipo: 'DADOS_INSUFICIENTES', severidade: 'INFO', titulo: 'Histórico insuficiente', mensagem: 'Registre outra pesagem', animalId: '3', identificacaoAnimal: 'B-03', rebanhoId: 'r1', rebanhoNome: 'São João' }
    ]
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    fazendaId.set('a');
    TestBed.configureTestingModule({ imports: [Alertas], providers: [
      provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
      { provide: FazendaContextService, useValue: { fazendaAtivaId: fazendaId, fazendaAtiva: signal({ nome: 'São João' }) } }
    ] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Alertas);
  });

  afterEach(() => {
    fixture.destroy();
    http.verify();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  function iniciar() { fixture.detectChanges(); vi.advanceTimersByTime(0); }

  it('não consulta sem fazenda e cancela a requisição ao trocar de fazenda', () => {
    fazendaId.set(null); iniciar(); http.expectNone(url());
    fazendaId.set('a'); iniciar(); const anterior = http.expectOne(url());
    fazendaId.set('b'); iniciar();
    expect(anterior.cancelled).toBe(true);
    expect(fixture.componentInstance.dados()).toBeNull();
    http.expectOne(url('b')).flush({ ...resumo(), fazendaId: 'b' });
  });

  it('ordena por gravidade, filtra sem acentos e aponta para o animal correto', () => {
    iniciar(); http.expectOne(url()).flush(resumo()); fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.filtrados().map(a => a.animalId)).toEqual(['1', '2', '3']);
    expect(fixture.nativeElement.querySelector('.message a').getAttribute('href')).toBe('/app/animais/1');
    component.busca.set('sao joao'); expect(component.filtrados().length).toBe(2);
    component.severidade.set('CRITICO'); expect(component.filtrados().length).toBe(1);
    component.rebanhoId.set('r2'); expect(component.filtrados().length).toBe(0);
    component.limparFiltros(); expect(component.filtrados().length).toBe(3);
  });

  it('atualiza automaticamente sem sobrepor requisições e pausa quando oculto', () => {
    iniciar(); const inicial = http.expectOne(url());
    vi.advanceTimersByTime(60_000); http.expectNone(url());
    inicial.flush(resumo());
    vi.advanceTimersByTime(60_000); http.expectOne(url()).flush(resumo());
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    vi.advanceTimersByTime(60_000); http.expectNone(url());
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    http.expectOne(url()).flush(resumo());
    fixture.destroy(); vi.advanceTimersByTime(60_000); http.expectNone(url());
  });

  it('mostra falha sem afirmar que não há alertas e permite tentar novamente', () => {
    iniciar(); http.expectOne(url()).flush({}, { status: 500, statusText: 'Erro' }); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Nenhum alerta ativo');
    fixture.componentInstance.atualizar(); http.expectOne(url()).flush(resumo());
    expect(fixture.componentInstance.erro()).toBe('');
  });

  it('preserva a última consulta com aviso de desatualização, mas limpa após perda de acesso', () => {
    iniciar(); http.expectOne(url()).flush(resumo());
    fixture.componentInstance.atualizar(); http.expectOne(url()).flush({}, { status: 500, statusText: 'Erro' }); fixture.detectChanges();
    expect(fixture.componentInstance.alertas().length).toBe(3);
    expect(fixture.nativeElement.textContent).toContain('podem estar desatualizados');
    fixture.componentInstance.atualizar(); http.expectOne(url()).flush({}, { status: 403, statusText: 'Proibido' });
    expect(fixture.componentInstance.dados()).toBeNull();
  });

  it('remove alertas resolvidos e diferencia fazenda sem animais de nenhum alerta', () => {
    iniciar(); http.expectOne(url()).flush(resumo());
    fixture.componentInstance.atualizar(); http.expectOne(url()).flush({ ...resumo(), alertas: [] }); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nenhum alerta ativo');
    expect(fixture.nativeElement.querySelectorAll('.message').length).toBe(0);
    fixture.componentInstance.atualizar(); http.expectOne(url()).flush({ ...resumo(), animaisAtivos: 0, alertas: [] }); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nenhum animal ativo');
  });
});
