import {
  Component,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';

import {
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
  SeveridadeAlertaDesempenho
} from '../../core/desempenho/models/desempenho';


type MetricaGrafico =
  | 'GMD'
  | 'PESO'
  | 'COBERTURA'
  | 'ALERTAS';

type TipoGrafico =
  | 'BARRAS'
  | 'LINHA';


@Component({
  selector: 'app-desempenho',
  standalone: true,

  imports: [
    DecimalPipe,
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

  readonly metricaGrafico =
    signal<MetricaGrafico>('GMD');

  readonly tipoGrafico =
    signal<TipoGrafico>('BARRAS');

  readonly alertasPrioritarios =
    computed(() =>
      this.dados()
        ?.alertas
        .slice(0, 12) ?? []
    );


  readonly tituloGrafico =
    computed(() => {

      switch (this.metricaGrafico()) {

        case 'PESO':
          return 'Peso médio por rebanho';

        case 'COBERTURA':
          return 'Cobertura de GMD por rebanho';

        case 'ALERTAS':
          return 'Ocorrências por rebanho';

        default:
          return 'GMD médio por rebanho';
      }
    });


  readonly descricaoGrafico =
    computed(() => {

      switch (this.metricaGrafico()) {

        case 'PESO':
          return 'Compare o peso médio atual dos animais ativos em cada lote.';

        case 'COBERTURA':
          return 'Mostra quanto do lote possui ao menos duas pesagens válidas para cálculo de GMD.';

        case 'ALERTAS':
          return 'Compare animais em perda, GMD baixo e pesagens atrasadas entre os lotes.';

        default:
          return 'Compare o ritmo médio de ganho de peso dos lotes. A referência indica o parâmetro de atenção.';
      }
    });


  readonly temDadosGrafico =
    computed(() => {

      const dados =
        this.dados();

      if (!dados) {
        return false;
      }

      switch (this.metricaGrafico()) {

        case 'PESO':
          return dados.rebanhos.some(
            item =>
              item.pesoMedioAtualKg !== null
          );

        case 'COBERTURA':
        case 'ALERTAS':
          return dados.rebanhos.length > 0;

        default:
          return dados.rebanhos.some(
            item =>
              item.gmdMedioKgDia !== null
          );
      }
    });


  readonly graficoRebanhos =
    computed<EChartsCoreOption>(() => {

      const dados =
        this.dados();

      if (!dados) {
        return {};
      }

      const metrica =
        this.metricaGrafico();

      const tipo =
        this.tipoGrafico();

      if (metrica === 'ALERTAS') {

        const rebanhos =
          dados.rebanhos;

        return {

          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow'
            }
          },

          legend: {
            top: 4,
            textStyle: {
              color: '#58675e',
              fontSize: 12
            }
          },

          grid: {
            top: 58,
            right: 28,
            bottom: 30,
            left: 28,
            containLabel: true
          },

          xAxis: {
            type: 'category',
            data:
              rebanhos.map(
                item => item.nome
              ),
            axisLabel: {
              color: '#607067',
              fontSize: 12,
              rotate:
                rebanhos.length > 5
                  ? 18
                  : 0
            },
            axisTick: {
              show: false
            }
          },

          yAxis: {
            type: 'value',
            minInterval: 1,
            axisLabel: {
              color: '#748078',
              fontSize: 11
            },
            splitLine: {
              lineStyle: {
                color: '#edf1ee'
              }
            }
          },

          series: [
            {
              name: 'Em perda',
              type: 'bar',
              data:
                rebanhos.map(
                  item =>
                    item.animaisEmPerda
                ),
              barMaxWidth: 28,
              itemStyle: {
                color: '#a94a46',
                borderRadius: [5, 5, 0, 0]
              }
            },
            {
              name: 'GMD baixo',
              type: 'bar',
              data:
                rebanhos.map(
                  item =>
                    item.animaisComGmdBaixo
                ),
              barMaxWidth: 28,
              itemStyle: {
                color: '#d39a2c',
                borderRadius: [5, 5, 0, 0]
              }
            },
            {
              name: 'Pesagem atrasada',
              type: 'bar',
              data:
                rebanhos.map(
                  item =>
                    item.animaisSemPesagemRecente
                ),
              barMaxWidth: 28,
              itemStyle: {
                color: '#58798f',
                borderRadius: [5, 5, 0, 0]
              }
            }
          ]
        };
      }


      const rebanhos =
        dados.rebanhos
          .filter(item => {

            if (metrica === 'PESO') {
              return item.pesoMedioAtualKg !== null;
            }

            if (metrica === 'GMD') {
              return item.gmdMedioKgDia !== null;
            }

            return true;
          });


      const valores =
        rebanhos.map(item => {

          if (metrica === 'PESO') {
            return item.pesoMedioAtualKg ?? 0;
          }

          if (metrica === 'COBERTURA') {
            return item.coberturaGmdPercentual;
          }

          return item.gmdMedioKgDia ?? 0;
        });


      const unidade =
        metrica === 'PESO'
          ? 'kg'
          : metrica === 'COBERTURA'
            ? '%'
            : 'kg/dia';


      const cor =
        metrica === 'PESO'
          ? '#4e7898'
          : metrica === 'COBERTURA'
            ? '#7a8d3c'
            : '#2f7a4b';


      const tooltip = (
        params: any
      ) => {

        const item =
          Array.isArray(params)
            ? params[0]
            : params;

        const rebanho =
          rebanhos[item.dataIndex];

        const valor =
          valores[item.dataIndex];

        return `
          <strong>${rebanho.nome}</strong><br>
          ${this.rotuloMetrica(metrica)}:
          ${this.formatarNumero(valor)} ${unidade}<br>
          ${rebanho.animaisComGmd} de
          ${rebanho.animaisAtivos} animais com GMD calculável
        `;
      };


      const markLine =
        metrica === 'GMD'
          ? {
              silent: true,
              symbol: 'none',
              lineStyle: {
                type: 'dashed' as const,
                color: '#d59d28',
                width: 2
              },
              label: {
                formatter:
                  `Atenção: ${this.formatarNumero(
                    dados.gmdMinimoAlertaKgDia
                  )} kg/dia`,
                color: '#8a651b',
                fontSize: 11
              },
              data: [
                {
                  yAxis:
                    dados.gmdMinimoAlertaKgDia
                }
              ]
            }
          : undefined;


      if (tipo === 'LINHA') {

        return {

          tooltip: {
            trigger: 'axis',
            formatter: tooltip
          },

          grid: {
            top: 45,
            right: 36,
            bottom: 44,
            left: 28,
            containLabel: true
          },

          xAxis: {
            type: 'category',
            boundaryGap: false,
            data:
              rebanhos.map(
                item => item.nome
              ),
            axisLabel: {
              color: '#607067',
              fontSize: 12,
              rotate:
                rebanhos.length > 5
                  ? 18
                  : 0
            },
            axisTick: {
              show: false
            }
          },

          yAxis: {
            type: 'value',
            scale:
              metrica !== 'COBERTURA',
            min:
              metrica === 'COBERTURA'
                ? 0
                : undefined,
            max:
              metrica === 'COBERTURA'
                ? 100
                : undefined,
            axisLabel: {
              color: '#748078',
              fontSize: 11,
              formatter:
                `{value} ${unidade}`
            },
            splitLine: {
              lineStyle: {
                color: '#edf1ee'
              }
            }
          },

          series: [
            {
              type: 'line',
              data: valores,
              smooth: true,
              symbol: 'circle',
              symbolSize: 9,
              lineStyle: {
                width: 3,
                color: cor
              },
              itemStyle: {
                color: cor,
                borderColor: '#ffffff',
                borderWidth: 2
              },
              areaStyle: {
                opacity: 0.08,
                color: cor
              },
              markLine
            }
          ]
        };
      }


      return {

        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: tooltip
        },

        grid: {
          top: 28,
          right: 36,
          bottom: 44,
          left: 28,
          containLabel: true
        },

        xAxis: {
          type: 'category',
          data:
            rebanhos.map(
              item => item.nome
            ),
          axisLabel: {
            color: '#607067',
            fontSize: 12,
            rotate:
              rebanhos.length > 5
                ? 18
                : 0
          },
          axisTick: {
            show: false
          }
        },

        yAxis: {
          type: 'value',
          scale:
            metrica !== 'COBERTURA',
          min:
            metrica === 'COBERTURA'
              ? 0
              : undefined,
          max:
            metrica === 'COBERTURA'
              ? 100
              : undefined,
          axisLabel: {
            color: '#748078',
            fontSize: 11,
            formatter:
              `{value} ${unidade}`
          },
          splitLine: {
            lineStyle: {
              color: '#edf1ee'
            }
          }
        },

        series: [
          {
            type: 'bar',
            data: valores,
            barMaxWidth: 44,
            itemStyle: {
              color: cor,
              borderRadius: [7, 7, 0, 0]
            },
            label: {
              show: true,
              position: 'top',
              color: '#526158',
              fontSize: 11,
              formatter: (
                params: any
              ) =>
                `${this.formatarNumero(
                  Number(params.value)
                )} ${unidade}`
            },
            markLine
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


  selecionarMetrica(
    metrica: MetricaGrafico
  ): void {

    this.metricaGrafico.set(
      metrica
    );

    if (
      metrica === 'ALERTAS'
    ) {
      this.tipoGrafico.set(
        'BARRAS'
      );
    }
  }


  selecionarTipoGrafico(
    tipo: TipoGrafico
  ): void {

    if (
      this.metricaGrafico() ===
      'ALERTAS'
    ) {
      return;
    }

    this.tipoGrafico.set(
      tipo
    );
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


  private rotuloMetrica(
    metrica: MetricaGrafico
  ): string {

    switch (metrica) {

      case 'PESO':
        return 'Peso médio';

      case 'COBERTURA':
        return 'Cobertura';

      default:
        return 'GMD médio';
    }
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
