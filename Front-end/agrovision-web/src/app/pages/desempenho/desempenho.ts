import {
  Component,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';

import {
  DatePipe,
  DecimalPipe
} from '@angular/common';

import {
  RouterLink
} from '@angular/router';

import {
  MatIconModule
} from '@angular/material/icon';

import {
  NgxEchartsDirective
} from 'ngx-echarts';

import {
  EChartsCoreOption
} from 'echarts/core';

import {
  finalize
} from 'rxjs';

import {
  FazendaContextService
} from '../../core/fazenda/services/fazenda-context.service';

import {
  DesempenhoService
} from '../../core/desempenho/services/desempenho.service';

import {
  AlertaDesempenho,
  DesempenhoFazenda,
  SeveridadeAlertaDesempenho,
  TendenciaDesempenho
} from '../../core/desempenho/models/desempenho';

@Component({
  selector: 'app-desempenho',
  standalone: true,

  imports: [
    DecimalPipe,
    DatePipe,
    RouterLink,
    MatIconModule,
    NgxEchartsDirective
  ],

  templateUrl: './desempenho.html',
  styleUrl: './desempenho.scss'
})
export class Desempenho {

  private readonly desempenhoService =
    inject(DesempenhoService);

  readonly fazendaContext =
    inject(FazendaContextService);

  readonly dados =
    signal<DesempenhoFazenda | null>(null);

  readonly loading =
    signal(false);

  readonly errorMessage =
    signal('');

  readonly alertasPrioritarios =
    computed(() =>
      this.dados()
        ?.alertas
        .slice(0, 12) ?? []
    );

  readonly graficoRebanhos =
    computed<EChartsCoreOption>(() => {

      const dados = this.dados();

      if (!dados) {
        return {};
      }

      const rebanhos =
        dados.rebanhos
          .filter(item =>
            item.gmdMedioKgDia !== null
          );

      if (rebanhos.length === 0) {
        return {};
      }

      return {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: (params: any) => {

            const item =
              Array.isArray(params)
                ? params[0]
                : params;

            const rebanho =
              rebanhos[item.dataIndex];

            return `
              <strong>${rebanho.nome}</strong><br>
              GMD médio: ${this.formatarNumero(
                rebanho.gmdMedioKgDia
              )} kg/dia<br>
              ${rebanho.animaisComGmd} de
              ${rebanho.animaisAtivos} animais com cálculo
            `;
          }
        },

        grid: {
          top: 10,
          right: 35,
          bottom: 30,
          left: 20,
          containLabel: true
        },

        xAxis: {
          type: 'value',
          axisLabel: {
            formatter: '{value} kg/d'
          },
          splitLine: {
            lineStyle: {
              color: '#edf1ee'
            }
          }
        },

        yAxis: {
          type: 'category',
          inverse: true,
          data:
            rebanhos.map(
              item => item.nome
            ),
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          }
        },

        series: [
          {
            type: 'bar',
            data:
              rebanhos.map(
                item =>
                  item.gmdMedioKgDia
              ),
            barMaxWidth: 24,
            itemStyle: {
              color: '#2f7a4b',
              borderRadius: 5
            },
            markLine: {
              silent: true,
              symbol: 'none',
              lineStyle: {
                type: 'dashed',
                color: '#d59d28'
              },
              data: [
                {
                  xAxis:
                    dados.gmdMinimoAlertaKgDia
                }
              ]
            }
          }
        ]
      };
    });


  constructor() {

    effect(onCleanup => {

      const fazendaId =
        this.fazendaContext
          .fazendaAtivaId();

      if (!fazendaId) {
        this.dados.set(null);
        return;
      }

      this.loading.set(true);
      this.errorMessage.set('');

      const subscription =
        this.desempenhoService
          .buscarPorFazenda(
            fazendaId
          )
          .pipe(
            finalize(() => {

              if (
                this.fazendaContext
                  .fazendaAtivaId() ===
                fazendaId
              ) {
                this.loading.set(false);
              }
            })
          )
          .subscribe({

            next: response => {

              if (
                this.fazendaContext
                  .fazendaAtivaId() !==
                fazendaId
              ) {
                return;
              }

              this.dados.set(response);
            },

            error: error => {

              console.error(
                'Erro ao carregar desempenho:',
                error
              );

              if (
                this.fazendaContext
                  .fazendaAtivaId() !==
                fazendaId
              ) {
                return;
              }

              this.dados.set(null);

              this.errorMessage.set(
                this.extrairMensagemErro(
                  error,
                  'Não foi possível carregar os indicadores de desempenho.'
                )
              );
            }
          });

      onCleanup(() => {
        subscription.unsubscribe();
      });
    });
  }


  labelTendencia(
    tendencia: TendenciaDesempenho
  ): string {

    switch (tendencia) {

      case 'GANHO':
        return 'Em ganho';

      case 'ESTAVEL':
        return 'Estável';

      case 'PERDA':
        return 'Em perda';

      default:
        return 'Sem dados';
    }
  }


  iconeTendencia(
    tendencia: TendenciaDesempenho
  ): string {

    switch (tendencia) {

      case 'GANHO':
        return 'trending_up';

      case 'PERDA':
        return 'trending_down';

      case 'ESTAVEL':
        return 'trending_flat';

      default:
        return 'remove';
    }
  }


  iconeAlerta(
    alerta: AlertaDesempenho
  ): string {

    switch (alerta.tipo) {

      case 'PERDA_PESO':
        return 'trending_down';

      case 'GMD_BAIXO':
        return 'speed';

      case 'SEM_PESAGEM_RECENTE':
        return 'event_busy';

      default:
        return 'info_outline';
    }
  }


  labelSeveridade(
    severidade: SeveridadeAlertaDesempenho
  ): string {

    switch (severidade) {

      case 'CRITICO':
        return 'Crítico';

      case 'ATENCAO':
        return 'Atenção';

      default:
        return 'Informativo';
    }
  }


  limparErro(): void {

    this.errorMessage.set('');
  }


  private formatarNumero(
    valor: number | null
  ): string {

    if (valor === null) {
      return '—';
    }

    return new Intl.NumberFormat(
      'pt-BR',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    )
      .format(valor);
  }


  private extrairMensagemErro(
    error: any,
    fallback: string
  ): string {

    if (error?.error?.message) {
      return error.error.message;
    }

    if (
      typeof error?.error === 'string' &&
      error.error.trim()
    ) {
      return error.error;
    }

    if (error?.status === 0) {
      return 'Não foi possível conectar ao servidor.';
    }

    return fallback;
  }
}
