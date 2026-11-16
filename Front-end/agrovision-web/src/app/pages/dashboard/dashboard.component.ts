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
  MatIconModule
} from '@angular/material/icon';

import {
  catchError,
  finalize,
  forkJoin,
  of
} from 'rxjs';

import {
  RouterLink
} from '@angular/router';

import {
  NgxEchartsDirective
} from 'ngx-echarts';

import {
  EChartsCoreOption
} from 'echarts/core';

import {
  FazendaContextService
} from '../../core/fazenda/services/fazenda-context.service';

import {
  DashboardService
} from '../../core/dashboard/services/dashboard.service';

import {
  DashboardResponse
} from '../../core/dashboard/models/dashboard-response';

import {
  DesempenhoService
} from '../../core/desempenho/services/desempenho.service';

import {
  DesempenhoFazenda
} from '../../core/desempenho/models/desempenho';


@Component({
  selector: 'app-dashboard',

  standalone: true,

  imports: [
    MatIconModule,
    DecimalPipe,
    DatePipe,
    RouterLink,
    NgxEchartsDirective
  ],

  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class Dashboard {

  private readonly dashboardService =
    inject(DashboardService);

  private readonly desempenhoService =
    inject(DesempenhoService);


  readonly fazendaContext =
    inject(FazendaContextService);


  // ==========================================
  // ESTADO
  // ==========================================

  readonly dashboard =
    signal<DashboardResponse | null>(
      null
    );

  readonly desempenho =
    signal<DesempenhoFazenda | null>(
      null
    );


  readonly loading =
    signal(false);


  readonly errorMessage =
    signal('');


  // ==========================================
  // GRÁFICO - SITUAÇÃO DO PLANTEL
  // ==========================================

  readonly graficoSituacao =
    computed<EChartsCoreOption>(() => {

      const dados =
        this.dashboard();


      if (!dados) {

        return {};

      }


      return {

        tooltip: {

          trigger: 'item',

          formatter: (params: any) => {

            const percentual =
              dados.totalAnimais > 0
                ? (
                    params.value /
                    dados.totalAnimais
                  ) * 100
                : 0;


            return `
              <strong>${params.name}</strong><br>
              ${params.value} animais<br>
              ${percentual.toFixed(1)}% do plantel
            `;
          }

        },


        series: [

          {

            name: 'Situação',

            type: 'pie',

            radius: [
              '66%',
              '86%'
            ],

            center: [
              '50%',
              '50%'
            ],

            avoidLabelOverlap: true,


            itemStyle: {

              borderColor: '#ffffff',

              borderWidth: 4,

              borderRadius: 6

            },


            label: {
              show: false
            },


            emphasis: {

              scale: true,

              scaleSize: 6

            },


            data: [

              {
                name: 'Ativos',
                value: dados.animaisAtivos,
                itemStyle: {
                  color: '#2f7a4b'
                }
              },

              {
                name: 'Inativos',
                value: dados.animaisInativos,
                itemStyle: {
                  color: '#8d9991'
                }
              },

              {
                name: 'Vendidos',
                value: dados.animaisVendidos,
                itemStyle: {
                  color: '#4e7898'
                }
              },

              {
                name: 'Mortos',
                value: dados.animaisMortos,
                itemStyle: {
                  color: '#a94a46'
                }
              }

            ]

          }

        ]

      };

    });


  // ==========================================
  // GRÁFICO - REBANHOS
  // ==========================================

  readonly graficoRebanhos =
    computed<EChartsCoreOption>(() => {

      const dados =
        this.dashboard();


      if (
        !dados ||
        dados.rebanhos.length === 0
      ) {

        return {};

      }


      /*
       * Ordenamos apenas uma cópia para
       * não alterar a resposta original
       * utilizada pela tabela.
       */
      const rebanhos =
        [...dados.rebanhos]
          .sort(
            (a, b) =>
              b.quantidadeAnimais -
              a.quantidadeAnimais
          );


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
              rebanhos[
                item.dataIndex
              ];


            return `
              <strong>${rebanho.nome}</strong><br>
              ${rebanho.quantidadeAnimais} animais<br>
              ${rebanho.animaisAtivos} ativos<br>
              Peso médio:
              ${this.formatarNumero(rebanho.pesoMedio)} kg
            `;
          }

        },


        grid: {

          top: 10,

          right: 35,

          bottom: 25,

          left: 15,

          containLabel: true

        },


        xAxis: {

          type: 'value',

          minInterval: 1,

          axisLine: {
            show: false
          },

          axisTick: {
            show: false
          },

          splitLine: {

            lineStyle: {
              color: '#edf1ee'
            }

          },

          axisLabel: {

            color: '#7b887f',

            fontSize: 10

          }

        },


        yAxis: {

          type: 'category',

          inverse: true,

          data:
            rebanhos.map(
              rebanho =>
                rebanho.nome
            ),


          axisLine: {
            show: false
          },

          axisTick: {
            show: false
          },

          axisLabel: {

            color: '#3f5146',

            fontSize: 11,

            width: 130,

            overflow: 'truncate'

          }

        },


        series: [

          {

            name: 'Animais',

            type: 'bar',

            data:
              rebanhos.map(
                rebanho =>
                  rebanho.quantidadeAnimais
              ),

            barWidth: 18,


            itemStyle: {

              color: '#2f7a4b',

              borderRadius: [
                0,
                6,
                6,
                0
              ]

            },


            label: {

              show: true,

              position: 'right',

              color: '#526158',

              fontSize: 10,

              formatter: '{c}'

            }

          }

        ]

      };

    });


  // ==========================================
  // GRÁFICO - EVOLUÇÃO DE PESO
  // ==========================================

  readonly graficoEvolucaoPeso =
    computed<EChartsCoreOption>(() => {

      const dados =
        this.dashboard();


      if (
        !dados ||
        dados.evolucaoPeso.length === 0
      ) {

        return {};

      }


      const labels =
        dados.evolucaoPeso.map(
          item =>
            this.formatarPeriodo(
              item.periodo
            )
        );


      const pesos =
        dados.evolucaoPeso.map(
          item =>
            item.pesoMedio
        );


      return {

        tooltip: {

          trigger: 'axis',

          formatter: (params: any) => {

            const item =
              Array.isArray(params)
                ? params[0]
                : params;


            return `
              <strong>${item.axisValue}</strong><br>
              Peso médio:
              ${this.formatarNumero(item.value)} kg
            `;
          }

        },


        grid: {

          top: 25,

          right: 25,

          bottom: 35,

          left: 20,

          containLabel: true

        },


        xAxis: {

          type: 'category',

          boundaryGap: false,

          data: labels,


          axisLine: {

            lineStyle: {
              color: '#dce3dd'
            }

          },


          axisTick: {
            show: false
          },


          axisLabel: {

            color: '#78867d',

            fontSize: 10

          }

        },


        yAxis: {

          type: 'value',

          scale: true,


          axisLine: {
            show: false
          },


          axisTick: {
            show: false
          },


          axisLabel: {

            color: '#78867d',

            fontSize: 10,

            formatter: (
              value: number
            ) => `${value} kg`

          },


          splitLine: {

            lineStyle: {
              color: '#edf1ee'
            }

          }

        },


        series: [

          {

            name: 'Peso médio',

            type: 'line',

            data: pesos,

            smooth: true,

            symbol: 'circle',

            symbolSize: 8,


            lineStyle: {

              width: 3,

              color: '#2f7a4b'

            },


            itemStyle: {

              color: '#2f7a4b',

              borderColor: '#ffffff',

              borderWidth: 2

            },


            areaStyle: {

              color: 'rgba(47, 122, 75, 0.10)'

            },


            emphasis: {

              focus: 'series',

              scale: true

            }

          }

        ]

      };

    });


  // ==========================================
  // CONSTRUTOR
  // ==========================================

  constructor() {

    /*
     * Sempre que a fazenda ativa mudar,
     * carregamos o dashboard correspondente.
     */
    effect(onCleanup => {

      const fazendaId =
        this.fazendaContext
          .fazendaAtivaId();


      this.dashboard.set(
        null
      );

      this.desempenho.set(
        null
      );


      this.errorMessage.set(
        ''
      );


      if (!fazendaId) {

        this.loading.set(
          false
        );

        return;
      }


      this.loading.set(
        true
      );


      const subscription =
        forkJoin({

          dashboard:
            this.dashboardService
              .buscarPorFazenda(
                fazendaId
              ),

          desempenho:
            this.desempenhoService
              .buscarPorFazenda(
                fazendaId
              )
              .pipe(
                catchError(error => {

                  console.error(
                    'Erro ao carregar GMD no dashboard:',
                    error
                  );

                  return of(null);
                })
              )

        })

          .pipe(

            finalize(() => {

              if (
                this.fazendaContext
                  .fazendaAtivaId() ===
                fazendaId
              ) {

                this.loading.set(
                  false
                );

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


              this.dashboard.set(
                response.dashboard
              );

              this.desempenho.set(
                response.desempenho
              );

            },


            error: error => {

              console.error(
                'Erro ao carregar dashboard:',
                error
              );


              if (
                this.fazendaContext
                  .fazendaAtivaId() !==
                fazendaId
              ) {

                return;
              }


              this.errorMessage.set(
                this.extrairMensagemErro(
                  error,
                  'Não foi possível carregar os indicadores da fazenda.'
                )
              );

            }

          });


      /*
       * Cancela a requisição anterior
       * quando a fazenda selecionada muda.
       */
      onCleanup(() => {

        subscription.unsubscribe();

      });

    });

  }


  gmdRebanho(
    rebanhoId: string
  ): number | null {

    return this.desempenho()
      ?.rebanhos
      .find(
        item =>
          item.rebanhoId === rebanhoId
      )
      ?.gmdMedioKgDia ?? null;
  }


  // ==========================================
  // PERCENTUAL DE SITUAÇÃO
  // ==========================================

  percentualSituacao(
    quantidade: number
  ): number {

    const dados =
      this.dashboard();


    if (
      !dados ||
      dados.totalAnimais === 0
    ) {

      return 0;
    }


    return Math.round(
      (
        quantidade /
        dados.totalAnimais
      ) * 100
    );

  }


  // ==========================================
  // FORMATAR PERÍODO
  // ==========================================

  formatarPeriodo(
    periodo: string
  ): string {

    const partes =
      periodo.split('-');


    if (
      partes.length !== 2
    ) {

      return periodo;
    }


    const ano =
      Number(
        partes[0]
      );


    const mes =
      Number(
        partes[1]
      );


    if (
      !Number.isFinite(ano) ||
      !Number.isFinite(mes)
    ) {

      return periodo;
    }


    const data =
      new Date(
        ano,
        mes - 1,
        1
      );


    return new Intl.DateTimeFormat(
      'pt-BR',
      {
        month: 'short',
        year: '2-digit'
      }
    )
      .format(data)
      .replace('.', '');

  }


  // ==========================================
  // FORMATAR NÚMERO
  // ==========================================

  private formatarNumero(
    valor: number
  ): string {

    return new Intl.NumberFormat(
      'pt-BR',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    )
      .format(valor);

  }


  // ==========================================
  // ERRO
  // ==========================================

  limparErro(): void {

    this.errorMessage.set('');

  }


  private extrairMensagemErro(
    error: any,
    fallback: string
  ): string {

    if (
      typeof error?.error === 'string' &&
      error.error.trim()
    ) {

      return error.error;
    }


    if (
      error?.error?.message
    ) {

      return error.error.message;
    }


    if (
      error.status === 0
    ) {

      return 'Não foi possível conectar ao servidor.';
    }


    return fallback;

  }

}