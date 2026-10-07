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
  MatIconModule
} from '@angular/material/icon';

import {
  forkJoin,
  finalize
} from 'rxjs';

import {
  FazendaContextService
} from '../../core/fazenda/services/fazenda-context.service';

import {
  AnimalService
} from '../../core/animal/services/animal.service';

import {
  AnimalResponse
} from '../../core/animal/models/animal-response';

import {
  AnimalRequest
} from '../../core/animal/models/animal-request';

import {
  SexoAnimal
} from '../../core/animal/models/sexo-animal';

import {
  RebanhoService
} from '../../core/rebanho/services/rebanho.service';

import {
  RebanhoResponse
} from '../../core/rebanho/models/rebanho-response';


@Component({
  selector: 'app-animais',

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule
  ],

  templateUrl: './animais.html',
  styleUrl: './animais.scss'
})
export class Animais {

  private readonly formBuilder =
    inject(FormBuilder);

  private readonly animalService =
    inject(AnimalService);

  private readonly rebanhoService =
    inject(RebanhoService);

  readonly fazendaContext =
    inject(FazendaContextService);


  // ========================================
  // ESTADO
  // ========================================

  animais =
    signal<AnimalResponse[]>([]);

  rebanhos =
    signal<RebanhoResponse[]>([]);

  loading =
    signal(false);

  salvando =
    signal(false);

  alterandoStatusId =
    signal<string | null>(null);

  errorMessage =
    signal('');


  // ========================================
  // FILTROS
  // ========================================

  busca =
    signal('');

  filtroRebanho =
    signal('');

  filtroSituacao =
    signal('');


  readonly animaisFiltrados =
    computed(() => {

      const busca =
        this.busca()
          .trim()
          .toLowerCase();

      const rebanhoId =
        this.filtroRebanho();

      const situacao =
        this.filtroSituacao();


      return this.animais()
        .filter(animal => {

          const correspondeBusca =
            !busca ||
            animal.identificacao
              .toLowerCase()
              .includes(busca) ||
            animal.raca
              .toLowerCase()
              .includes(busca);


          const correspondeRebanho =
            !rebanhoId ||
            animal.rebanhoId === rebanhoId;


          const correspondeSituacao =
            !situacao ||
            animal.situacao === situacao;


          return (
            correspondeBusca &&
            correspondeRebanho &&
            correspondeSituacao
          );

        });

    });


  // ========================================
  // MODAL
  // ========================================

  modalAberto =
    signal(false);


  readonly hoje =
    new Date()
      .toISOString()
      .split('T')[0];


  // ========================================
  // FORM
  // ========================================

  animalForm =
    this.formBuilder.group({

      identificacao: [
        '',
        [
          Validators.required,
          Validators.maxLength(100)
        ]
      ],

      raca: [
        '',
        [
          Validators.required,
          Validators.maxLength(100)
        ]
      ],

      sexo: [
        '',
        Validators.required
      ],

      dataNascimento: [
        '',
        Validators.required
      ],

      pesoAtual: [
        null as number | null,
        [
          Validators.required,
          Validators.min(0.1)
        ]
      ],

      rebanhoId: [
        '',
        Validators.required
      ]

    });


  constructor() {

    /*
     * Sempre que a fazenda ativa mudar,
     * os animais e os rebanhos disponíveis
     * são recarregados.
     */
    effect(() => {

      const fazendaId =
        this.fazendaContext
          .fazendaAtivaId();


      if (!fazendaId) {

        this.animais.set([]);

        this.rebanhos.set([]);

        return;
      }


      this.carregarDados(
        fazendaId
      );

    });

  }


  // ========================================
  // CARREGAR DADOS
  // ========================================

  carregarDados(
    fazendaId: string
  ): void {

    this.loading.set(true);

    this.errorMessage.set('');


    forkJoin({

      animais:
        this.animalService
          .listarPorFazenda(fazendaId),

      rebanhos:
        this.rebanhoService
          .listarPorFazenda(fazendaId)

    })

      .pipe(

        finalize(() => {

          this.loading.set(false);

        })

      )

      .subscribe({

        next: response => {

          /*
           * Impede resposta antiga caso
           * o usuário troque rapidamente
           * de fazenda.
           */
          if (
            this.fazendaContext
              .fazendaAtivaId() !== fazendaId
          ) {

            return;

          }


          this.animais.set(
            response.animais
          );


          this.rebanhos.set(
            response.rebanhos
          );


          /*
           * Os filtros são zerados quando
           * mudamos de propriedade.
           */
          this.busca.set('');

          this.filtroRebanho.set('');

          this.filtroSituacao.set('');

        },


        error: error => {

          console.error(
            'Erro ao carregar módulo de animais:',
            error
          );


          this.animais.set([]);

          this.rebanhos.set([]);


          this.errorMessage.set(
            'Não foi possível carregar os animais desta fazenda.'
          );

        }

      });

  }


  // ========================================
  // FILTROS
  // ========================================

  atualizarBusca(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    this.busca.set(
      input.value
    );

  }


  atualizarFiltroRebanho(
    event: Event
  ): void {

    const select =
      event.target as HTMLSelectElement;

    this.filtroRebanho.set(
      select.value
    );

  }


  atualizarFiltroSituacao(
    event: Event
  ): void {

    const select =
      event.target as HTMLSelectElement;

    this.filtroSituacao.set(
      select.value
    );

  }


  limparFiltros(): void {

    this.busca.set('');

    this.filtroRebanho.set('');

    this.filtroSituacao.set('');

  }


  // ========================================
  // NOVO ANIMAL
  // ========================================

  abrirNovoAnimal(): void {

    this.errorMessage.set('');


    if (
      !this.fazendaContext
        .fazendaAtivaId()
    ) {

      this.errorMessage.set(
        'Selecione uma fazenda antes de cadastrar um animal.'
      );

      return;

    }


    if (
      this.rebanhos().length === 0
    ) {

      this.errorMessage.set(
        'Cadastre pelo menos um rebanho antes de cadastrar animais.'
      );

      return;

    }


    this.animalForm.reset({

      identificacao: '',

      raca: '',

      sexo: '',

      dataNascimento: '',

      pesoAtual: null,

      rebanhoId:
        this.rebanhos().length === 1
          ? this.rebanhos()[0].id
          : ''

    });


    this.modalAberto.set(true);

  }


  fecharModal(): void {

    if (this.salvando()) {
      return;
    }


    this.modalAberto.set(false);


    this.animalForm.reset({

      identificacao: '',

      raca: '',

      sexo: '',

      dataNascimento: '',

      pesoAtual: null,

      rebanhoId: ''

    });

  }


  // ========================================
  // CADASTRAR
  // ========================================

  salvar(): void {

    this.errorMessage.set('');


    if (
      this.animalForm.invalid
    ) {

      this.animalForm
        .markAllAsTouched();

      return;

    }


    const form =
      this.animalForm
        .getRawValue();


    const request: AnimalRequest = {

      identificacao:
        form.identificacao!
          .trim(),

      raca:
        form.raca!
          .trim(),

      sexo:
        form.sexo as SexoAnimal,

      dataNascimento:
        form.dataNascimento!,

      pesoAtual:
        Number(
          form.pesoAtual
        ),

      rebanhoId:
        form.rebanhoId!

    };


    this.salvando.set(true);


    this.animalService
      .cadastrar(request)

      .pipe(

        finalize(() => {

          this.salvando.set(false);

        })

      )

      .subscribe({

        next: animal => {

          this.modalAberto.set(false);


          /*
           * Atualização direta da lista.
           * Não precisamos refazer a requisição.
           */
          this.animais.update(
            lista => [
              ...lista,
              animal
            ]
          );


          this.animalForm.reset();

        },


        error: error => {

          console.error(
            'Erro ao cadastrar animal:',
            error
          );


          this.errorMessage.set(
            this.extrairMensagemErro(
              error,
              'Não foi possível cadastrar o animal.'
            )
          );

        }

      });

  }


  // ========================================
  // ATIVAR / INATIVAR
  // ========================================

  alterarStatus(
    animal: AnimalResponse
  ): void {

    if (
      animal.situacao !== 'ATIVO' &&
      animal.situacao !== 'INATIVO'
    ) {

      return;

    }


    this.errorMessage.set('');

    this.alterandoStatusId.set(
      animal.id
    );


    const requisicao =
      animal.situacao === 'ATIVO'

        ? this.animalService
            .inativar(animal.id)

        : this.animalService
            .ativar(animal.id);


    requisicao

      .pipe(

        finalize(() => {

          this.alterandoStatusId.set(
            null
          );

        })

      )

      .subscribe({

        next: () => {

          this.animais.update(
            lista =>
              lista.map(item => {

                if (
                  item.id !== animal.id
                ) {

                  return item;

                }


                return {

                  ...item,

                  situacao:
                    animal.situacao === 'ATIVO'
                      ? 'INATIVO'
                      : 'ATIVO'

                };

              })
          );

        },


        error: error => {

          console.error(
            'Erro ao alterar situação:',
            error
          );


          this.errorMessage.set(
            this.extrairMensagemErro(
              error,
              'Não foi possível alterar a situação do animal.'
            )
          );

        }

      });

  }


  // ========================================
  // HELPERS VISUAIS
  // ========================================

  formatarSexo(
    sexo: string
  ): string {

    return sexo === 'MACHO'
      ? 'Macho'
      : 'Fêmea';

  }


  formatarSituacao(
    situacao: string
  ): string {

    switch (situacao) {

      case 'ATIVO':
        return 'Ativo';

      case 'INATIVO':
        return 'Inativo';

      case 'VENDIDO':
        return 'Vendido';

      case 'MORTO':
        return 'Morto';

      default:
        return situacao;

    }

  }


  formatarIdade(
    meses: number
  ): string {

    if (meses < 12) {

      return `${meses} meses`;

    }


    const anos =
      Math.floor(
        meses / 12
      );

    const mesesRestantes =
      meses % 12;


    if (
      mesesRestantes === 0
    ) {

      return anos === 1
        ? '1 ano'
        : `${anos} anos`;

    }


    return `${anos}a ${mesesRestantes}m`;

  }


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