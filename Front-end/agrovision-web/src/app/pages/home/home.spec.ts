import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Home } from './home';
import { FazendaContextService } from '../../core/fazenda/services/fazenda-context.service';

describe('Home', () => {
  const fazendaId = signal<string | null>(null);
  let http: HttpTestingController;

  beforeEach(() => {
    fazendaId.set(null);
    TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
        { provide: FazendaContextService, useValue: {
          fazendaAtivaId: fazendaId, fazendaAtiva: signal(null), loading: signal(false)
        } }
      ]
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.match('http://localhost:8080/api/me/context').forEach(req =>
      req.flush({ name: 'Maria Silva', email: 'teste1@gmail.com' })
    );
    http.verify();
  });

  function responderResumo(id: string) {
    http.expectOne(`http://localhost:8080/api/rebanhos/fazenda/${id}`).flush([{}]);
    http.expectOne(`http://localhost:8080/api/funcionarios/fazenda/${id}`).flush([]);
  }

  it('exibe o nome do perfil na saudação', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    http.expectOne('http://localhost:8080/api/me/context').flush({
      name: 'Maria Silva', email: 'teste1@gmail.com'
    });
    fixture.detectChanges();
    const saudacao = fixture.nativeElement.querySelector('.hero-greeting').textContent;
    expect(saudacao).toContain(', Maria Silva');
    expect(saudacao).not.toContain('teste1@gmail.com');
  });

  it('mantém a saudação sem nome quando o perfil falha', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    http.expectOne('http://localhost:8080/api/me/context').flush({}, { status: 500, statusText: 'Erro' });
    fixture.detectChanges();
    expect(fixture.componentInstance.nomeUsuario()).toBe('');
    expect(fixture.nativeElement.querySelector('.hero-greeting').textContent).not.toContain(',');
  });

  it('não consulta APIs da fazenda sem fazenda selecionada', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    expect(fixture.componentInstance.totalAnimais()).toBeNull();
    http.expectNone(req => req.url !== 'http://localhost:8080/api/me/context');
  });

  it('carrega os totais e ordena as últimas pesagens da fazenda', () => {
    fazendaId.set('a');
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    responderResumo('a');
    http.expectOne('http://localhost:8080/api/animais/fazenda/a').flush([{ id: '1' }, { id: '2' }]);
    http.expectOne('http://localhost:8080/api/animais/1/pesagens').flush([
      { id: 'antiga', dataRegistro: '2026-01-01T10:00:00' }
    ]);
    http.expectOne('http://localhost:8080/api/animais/2/pesagens').flush([
      { id: 'nova', dataRegistro: '2026-02-01T10:00:00' }
    ]);
    expect(fixture.componentInstance.totalRebanhos()).toBe(1);
    expect(fixture.componentInstance.totalAnimais()).toBe(2);
    expect(fixture.componentInstance.totalPesagens()).toBe(2);
    expect(fixture.componentInstance.totalFuncionarios()).toBe(0);
    expect(fixture.componentInstance.ultimasPesagens().map(p => p.id)).toEqual(['nova', 'antiga']);
  });

  it('cancela consultas da fazenda anterior ao trocar a seleção', () => {
    fazendaId.set('a');
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const anteriores = http.match(req => req.url.endsWith('/fazenda/a'));
    fazendaId.set('b');
    fixture.detectChanges();
    expect(anteriores.every(req => req.cancelled)).toBe(true);
    responderResumo('b');
    http.expectOne('http://localhost:8080/api/animais/fazenda/b').flush([]);
    expect(fixture.componentInstance.totalPesagens()).toBe(0);
  });

  it('preserva os demais totais se o histórico de pesagens falhar', () => {
    fazendaId.set('a');
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    responderResumo('a');
    http.expectOne('http://localhost:8080/api/animais/fazenda/a').flush([{ id: '1' }]);
    http.expectOne('http://localhost:8080/api/animais/1/pesagens').flush({}, { status: 500, statusText: 'Erro' });
    expect(fixture.componentInstance.totalAnimais()).toBe(1);
    expect(fixture.componentInstance.totalPesagens()).toBeNull();
    expect(fixture.componentInstance.erros()).toContain('Não foi possível carregar as pesagens.');
    expect(fixture.componentInstance.carregandoPesagens()).toBe(false);
  });
});
