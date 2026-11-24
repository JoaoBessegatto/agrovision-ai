import { Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { catchError, EMPTY, exhaustMap, filter, finalize, fromEvent, merge, Subject, timer } from 'rxjs';
import { FazendaContextService } from '../../core/fazenda/services/fazenda-context.service';
import { AlertaService, CentralAlertas } from '../../core/desempenho/services/alerta.service';
import { SeveridadeAlertaDesempenho } from '../../core/desempenho/models/desempenho';

@Component({
  selector: 'app-alertas',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule, RouterLink, MatIconModule],
  templateUrl: './alertas.html',
  styleUrl: './alertas.scss'
})
export class Alertas {
  readonly fazendaContext = inject(FazendaContextService);
  private readonly service = inject(AlertaService);
  private readonly document = inject(DOCUMENT);
  private readonly atualizar$ = new Subject<void>();

  readonly dados = signal<CentralAlertas | null>(null);
  readonly carregando = signal(false);
  readonly erro = signal('');
  readonly busca = signal('');
  readonly severidade = signal<SeveridadeAlertaDesempenho | ''>('');
  readonly rebanhoId = signal('');
  readonly prioridades = { CRITICO: 0, ATENCAO: 1, INFO: 2 };
  readonly rotulos = { CRITICO: 'Grave', ATENCAO: 'Médio', INFO: 'Informativo' };
  readonly icones = { CRITICO: 'report', ATENCAO: 'warning_amber', INFO: 'info' };

  readonly alertas = computed(() => this.dados()?.alertas ?? []);
  readonly graves = computed(() => this.alertas().filter(a => a.severidade === 'CRITICO').length);
  readonly medios = computed(() => this.alertas().filter(a => a.severidade === 'ATENCAO').length);
  readonly informativos = computed(() => this.alertas().filter(a => a.severidade === 'INFO').length);
  readonly rebanhos = computed(() => [...new Map(this.alertas().map(a => [a.rebanhoId, a.rebanhoNome])).entries()]
    .map(([id, nome]) => ({ id, nome })).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')));
  readonly filtrados = computed(() => {
    const busca = this.normalizar(this.busca().trim());
    return this.alertas().filter(a =>
      (!this.severidade() || a.severidade === this.severidade()) &&
      (!this.rebanhoId() || a.rebanhoId === this.rebanhoId()) &&
      (!busca || this.normalizar(`${a.identificacaoAnimal} ${a.rebanhoNome} ${a.titulo} ${a.mensagem}`).includes(busca))
    ).sort((a, b) => this.prioridades[a.severidade] - this.prioridades[b.severidade] ||
      a.identificacaoAnimal.localeCompare(b.identificacaoAnimal, 'pt-BR', { numeric: true }));
  });

  constructor() {
    effect(onCleanup => {
      const fazendaId = this.fazendaContext.fazendaAtivaId();
      this.dados.set(null);
      this.erro.set('');
      this.carregando.set(false);
      this.limparFiltros();
      if (!fazendaId) return;

      // Uma requisição por vez; a troca de fazenda e a saída da tela cancelam o fluxo anterior.
      const subscription = merge(timer(0, 60_000), this.atualizar$,
        fromEvent(this.document, 'visibilitychange'))
        .pipe(
          filter(() => !this.document.hidden),
          exhaustMap(() => {
            this.carregando.set(true);
            return this.service.listar(fazendaId).pipe(
              catchError(error => {
                if (error.status === 401 || error.status === 403) this.dados.set(null);
                this.erro.set('Não foi possível atualizar os alertas. Tente novamente.');
                return EMPTY;
              }),
              finalize(() => this.carregando.set(false))
            );
          })
        )
        .subscribe(dados => {
          this.dados.set(dados);
          this.erro.set('');
          // Se o último alerta do rebanho desapareceu, não manter um filtro sem opção visível.
          if (this.rebanhoId() && !dados.alertas.some(a => a.rebanhoId === this.rebanhoId())) this.rebanhoId.set('');
        });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  atualizar(): void { this.atualizar$.next(); }

  limparFiltros(): void {
    this.busca.set('');
    this.severidade.set('');
    this.rebanhoId.set('');
  }

  private normalizar(texto: string): string {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
  }
}
