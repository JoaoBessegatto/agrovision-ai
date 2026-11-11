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
  finalize
} from 'rxjs';

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
  DashboardRebanho
} from '../../core/dashboard/models/dashboard-rebanho';


@Component({
  selector: 'app-dashboard',

  standalone: true,

  imports: [
    MatIconModule,
    DecimalPipe,
    DatePipe
  ],

  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class Dashboard {

  private readonly dashboardService =
    inject(DashboardService);


  readonly fazendaContext =
    inject(FazendaContextService);


  // ==========================================
  // ESTADO
  // ==========================================

  dashboard =
    signal<DashboardResponse | null>(
      null
    );


  loading =
    signal(false);


  errorMessage =
    signal('');


  // ==========================================
  // MAIOR REBANHO
  // Usado apenas para largura das barras
  // ==========================================

  readonly maiorQuantidadeRebanho =
    computed(() => {

      const dados =
        this.dashboard();


      if (
        !dados ||
        dados.rebanhos.length === 0
      ) {

        return 0;
      }


      return Math.max(
        ...dados.rebanhos.map(
          rebanho =>
            rebanho.quantidadeAnimais
        )
      );

    });


  // ==========================================
  // MAIOR PESO DA EVOLUÇÃO
  // ==========================================

  readonly maiorPesoEvolucao =
    computed(() => {

      const dados =
        this.dashboard();


      if (
        !dados ||
        dados.evolucaoPeso.length === 0
      ) {

        return 0;
      }


      return Math.max(
        ...dados.evolucaoPeso.map(
          registro =>
            registro.pesoMedio
        )
      );

    });


  constructor() {

    /*
     * Dashboard acompanha a fazenda
     * atualmente selecionada no sistema.
     */
    effect(onCleanup => {

      const fazendaId =
        this.fazendaContext
          .fazendaAtivaId();


      this.dashboard.set(
        null
      );

      this.errorMessage.set('');


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
        this.dashboardService
          .buscarPorFazenda(
            fazendaId
          )

          .pipe(

            finalize(() => {

              /*
               * Evita interferência caso
               * o usuário troque de fazenda
               * durante a requisição.
               */
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

              /*
               * Ignora resposta antiga caso
               * a fazenda tenha mudado.
               */
              if (
                this.fazendaContext
                  .fazendaAtivaId() !==
                fazendaId
              ) {

                return;
              }


              this.dashboard.set(
                response
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
       * quando a fazenda muda.
       */
      onCleanup(() => {

        subscription.unsubscribe();

      });

    });

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
  // BARRA DO REBANHO
  // ==========================================

  percentualRebanho(
    rebanho: DashboardRebanho
  ): number {

    const maior =
      this.maiorQuantidadeRebanho();


    if (maior === 0) {
      return 0;
    }


    return (
      rebanho.quantidadeAnimais /
      maior
    ) * 100;

  }


  // ==========================================
  // BARRA EVOLUÇÃO PESO
  // ==========================================

  percentualPeso(
    peso: number
  ): number {

    const maior =
      this.maiorPesoEvolucao();


    if (maior === 0) {
      return 0;
    }


    return (
      peso /
      maior
    ) * 100;

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
        year: 'numeric'
      }
    )
      .format(data)
      .replace('.', '');

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