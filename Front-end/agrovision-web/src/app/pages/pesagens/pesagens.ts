import {
  Component,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  RouterLink
} from '@angular/router';

import {
  MatIconModule
} from '@angular/material/icon';

import {
  finalize,
  forkJoin
} from 'rxjs';

import {
  FazendaContextService
} from '../../core/fazenda/services/fazenda-context.service';

import {
  RegistroPesoService
} from '../../core/pesagem/services/registro-peso.service';

import {
  RegistroPesoResponse
} from '../../core/pesagem/models/registro-peso-response';

import {
  AnimalService
} from '../../core/animal/services/animal.service';

import {
  AnimalResponse
} from '../../core/animal/models/animal-response';

import {
  RebanhoService
} from '../../core/rebanho/services/rebanho.service';

import {
  RebanhoResponse
} from '../../core/rebanho/models/rebanho-response';


@Component({
  selector: 'app-pesagens',

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatIconModule
  ],

  templateUrl: './pesagens.html',

  styleUrl: './pesagens.scss'
})
export class Pesagens {

  private readonly formBuilder =
    inject(FormBuilder);

  private readonly registroPesoService =
    inject(RegistroPesoService);

  private readonly animalService =
    inject(AnimalService);

  private readonly rebanhoService =
    inject(RebanhoService);

  readonly fazendaContext =
    inject(FazendaContextService);


  // =========================================================
  // DADOS
  // =========================================================

  pesagens =
    signal<RegistroPesoResponse[]>([]);

  animais =
    signal<AnimalResponse[]>([]);

  rebanhos =
    signal<RebanhoResponse[]>([]);


  // =========================================================
  // ESTADO
  // =========================================================

  loading =
    signal(false);

  salvando =
    signal(false);

  modalAberto =
    signal(false);

  errorMessage =
    signal('');


  // =========================================================
  // FILTROS
  // =========================================================

  busca =
    signal('');

  filtroRebanho =
    signal('');

  dataInicio =
    signal('');

  dataFim =
    signal('');


  // =========================================================
  // FORMULÁRIO
  // =========================================================

  pesagemForm =
    this.formBuilder.group({

      animalId: [
        '',
        Validators.required
      ],

      pesoKg: [
        null as number | null,
        [
          Validators.required,
          Validators.min(0.1),
          Validators.max(1500)
        ]
      ]

    });


  // =========================================================
  // ANIMAIS ATIVOS
  // =========================================================

  readonly animaisAtivos =
    computed(() => {

      return this.animais()
        .filter(
          animal =>
            animal.situacao === 'ATIVO'
        );

    });


  // =========================================================
  // PESAGENS FILTRADAS
  // =========================================================

  readonly pesagensFiltradas =
    computed(() => {

      const busca =
        this.busca()
          .trim()
          .toLowerCase();

      const rebanhoId =
        this.filtroRebanho();

      const inicio =
        this.dataInicio();

      const fim =
        this.dataFim();


      return this.pesagens()
        .filter(registro => {

          // BUSCA

          const correspondeBusca =
            !busca ||
            registro
              .identificacaoAnimal
              .toLowerCase()
              .includes(busca) ||
            registro
              .rebanhoNome
              .toLowerCase()
              .includes(busca);


          // REBANHO

          const correspondeRebanho =
            !rebanhoId ||
            registro.rebanhoId ===
            rebanhoId;


          // DATA

          const dataRegistro =
            registro.dataRegistro
              .substring(0, 10);


          const correspondeInicio =
            !inicio ||
            dataRegistro >= inicio;


          const correspondeFim =
            !fim ||
            dataRegistro <= fim;


          return (
            correspondeBusca &&
            correspondeRebanho &&
            correspondeInicio &&
            correspondeFim
          );

        });

    });


  // =========================================================
  // INDICADORES
  // =========================================================

  readonly pesagensUltimos30Dias =
    computed(() => {

      const agora =
        new Date();


      const limite =
        new Date();


      limite.setDate(
        agora.getDate() - 30
      );


      return this.pesagens()
        .filter(registro => {

          const data =
            new Date(
              registro.dataRegistro
            );


          return data >= limite;

        })
        .length;

    });


  readonly pesoMedio =
    computed(() => {

      const registros =
        this.pesagens();


      if (
        registros.length === 0
      ) {

        return 0;

      }


      const soma =
        registros.reduce(
          (
            total,
            registro
          ) =>
            total +
            registro.pesoKg,
          0
        );


      return soma /
        registros.length;

    });


  readonly quantidadeAnimaisPesados =
    computed(() => {

      const ids =
        new Set(
          this.pesagens()
            .map(
              registro =>
                registro.animalId
            )
        );


      return ids.size;

    });


  readonly ultimaPesagem =
    computed(() => {

      const registros =
        this.pesagens();


      if (
        registros.length === 0
      ) {

        return null;

      }


      /*
       * Backend já entrega em ordem
       * decrescente.
       */
      return registros[0];

    });


  // =========================================================
  // CONSTRUTOR
  // =========================================================

  constructor() {

    effect(() => {

      const fazendaId =
        this.fazendaContext
          .fazendaAtivaId();


      if (!fazendaId) {

        this.pesagens.set([]);

        this.animais.set([]);

        this.rebanhos.set([]);

        return;

      }


      this.carregarDados(
        fazendaId
      );

    });

  }


  // =========================================================
  // CARREGAR DADOS
  // =========================================================

  carregarDados(
    fazendaId: string
  ): void {

    this.loading.set(true);

    this.errorMessage.set('');


    forkJoin({

      pesagens:
        this.registroPesoService
          .listarPorFazenda(
            fazendaId
          ),

      animais:
        this.animalService
          .listarPorFazenda(
            fazendaId
          ),

      rebanhos:
        this.rebanhoService
          .listarPorFazenda(
            fazendaId
          )

    })

      .pipe(

        finalize(() => {

          this.loading.set(false);

        })

      )

      .subscribe({

        next: response => {

          /*
           * Protege contra resposta antiga
           * caso o usuário troque rapidamente
           * de fazenda.
           */
          if (
            this.fazendaContext
              .fazendaAtivaId() !==
            fazendaId
          ) {

            return;

          }


          this.pesagens.set(
            response.pesagens
          );


          this.animais.set(
            response.animais
          );


          this.rebanhos.set(
            response.rebanhos
          );


          this.limparFiltros();

        },


        error: error => {

          console.error(
            'Erro ao carregar pesagens:',
            error
          );


          this.pesagens.set([]);

          this.animais.set([]);

          this.rebanhos.set([]);


          this.errorMessage.set(
            this.extrairMensagemErro(
              error,
              'Não foi possível carregar as pesagens da fazenda.'
            )
          );

        }

      });

  }


  // =========================================================
  // FILTROS
  // =========================================================

  atualizarBusca(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;


    this.busca.set(
      input.value
    );

  }


  atualizarRebanho(
    event: Event
  ): void {

    const select =
      event.target as HTMLSelectElement;


    this.filtroRebanho.set(
      select.value
    );

  }


  atualizarDataInicio(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;


    this.dataInicio.set(
      input.value
    );

  }


  atualizarDataFim(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;


    this.dataFim.set(
      input.value
    );

  }


  limparFiltros(): void {

    this.busca.set('');

    this.filtroRebanho.set('');

    this.dataInicio.set('');

    this.dataFim.set('');

  }


  // =========================================================
  // ABRIR MODAL
  // =========================================================

  abrirNovaPesagem(): void {

    this.errorMessage.set('');


    if (
      !this.fazendaContext
        .fazendaAtivaId()
    ) {

      this.errorMessage.set(
        'Selecione uma fazenda antes de registrar uma pesagem.'
      );

      return;

    }


    if (
      this.animaisAtivos().length === 0
    ) {

      this.errorMessage.set(
        'Não existem animais ativos disponíveis para pesagem.'
      );

      return;

    }


    this.pesagemForm.reset({

      animalId:
        this.animaisAtivos()
          .length === 1
          ? this.animaisAtivos()[0].id
          : '',

      pesoKg: null

    });


    this.modalAberto.set(
      true
    );

  }


  // =========================================================
  // FECHAR MODAL
  // =========================================================

  fecharModal(): void {

    if (
      this.salvando()
    ) {

      return;

    }


    this.modalAberto.set(
      false
    );


    this.pesagemForm.reset({

      animalId: '',

      pesoKg: null

    });

  }


  // =========================================================
  // REGISTRAR PESAGEM
  // =========================================================

  registrarPesagem(): void {

    this.errorMessage.set('');


    if (
      this.pesagemForm.invalid
    ) {

      this.pesagemForm
        .markAllAsTouched();

      return;

    }


    const form =
      this.pesagemForm
        .getRawValue();


    const animalId =
      form.animalId!;


    const pesoKg =
      Number(
        form.pesoKg
      );


    if (
      !Number.isFinite(pesoKg) ||
      pesoKg <= 0 ||
      pesoKg > 1500
    ) {

      this.pesagemForm
        .controls
        .pesoKg
        .setErrors({
          pesoInvalido: true
        });


      return;

    }


    this.salvando.set(
      true
    );


    this.registroPesoService
      .registrar(
        animalId,
        {
          pesoKg
        }
      )

      .pipe(

        finalize(() => {

          this.salvando.set(
            false
          );

        })

      )

      .subscribe({

        next: registro => {

          /*
           * Insere a pesagem no topo
           * da tabela imediatamente.
           */
          this.pesagens.update(
            registros => [
              registro,
              ...registros
            ]
          );


          /*
           * Atualiza o peso atual
           * do animal localmente.
           */
          this.animais.update(
            animais =>
              animais.map(
                animal => {

                  if (
                    animal.id !==
                    animalId
                  ) {

                    return animal;

                  }


                  return {

                    ...animal,

                    pesoAtual:
                      registro.pesoKg

                  };

                }
              )
          );


          this.modalAberto.set(
            false
          );


          this.pesagemForm.reset({

            animalId: '',

            pesoKg: null

          });

        },


        error: error => {

          console.error(
            'Erro ao registrar pesagem:',
            error
          );


          this.errorMessage.set(
            this.extrairMensagemErro(
              error,
              'Não foi possível registrar a pesagem.'
            )
          );

        }

      });

  }


  // =========================================================
  // ANIMAL SELECIONADO
  // =========================================================

  obterAnimalSelecionado():
    AnimalResponse | null {

    const animalId =
      this.pesagemForm
        .controls
        .animalId
        .value;


    if (!animalId) {

      return null;

    }


    return (
      this.animais()
        .find(
          animal =>
            animal.id === animalId
        ) ??
      null
    );

  }


  // =========================================================
  // ERROS
  // =========================================================

  limparErro(): void {

    this.errorMessage.set('');

  }


  private extrairMensagemErro(
    error: any,
    fallback: string
  ): string {

    if (
      typeof error?.error ===
      'string' &&
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
      error?.error?.mensagem
    ) {

      return error.error.mensagem;

    }


    if (
      error?.status === 0
    ) {

      return 'Não foi possível conectar ao servidor.';

    }


    if (
      error?.status === 401
    ) {

      return 'Sua sessão expirou. Faça login novamente.';

    }


    if (
      error?.status === 403
    ) {

      return 'Você não possui permissão para acessar estes dados.';

    }


    return fallback;

  }

}