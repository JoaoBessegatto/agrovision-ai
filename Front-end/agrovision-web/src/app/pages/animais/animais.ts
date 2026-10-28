import {
  Component,
  computed,
  effect,
  HostListener,
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
import { ActivatedRoute, RouterLink } from '@angular/router';
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


type CampoOrdenacao =
  'identificacao' | 'pesoAtual' | 'idadeMeses';

type DirecaoOrdenacao =
  'asc' | 'desc';


@Component({
  selector: 'app-animais',

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    RouterLink
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

  private readonly route =
    inject(ActivatedRoute);

  /*
   * Vindo de "Ver animais" na tela de Rebanhos:
   * /app/animais?rebanho=<id>
   */
  private rebanhoInicial: string | null =
    this.route.snapshot.queryParamMap
      .get('rebanho');


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


  ordenacao =
    signal<{
      campo: CampoOrdenacao;
      direcao: DirecaoOrdenacao;
    }>({
      campo: 'identificacao',
      direcao: 'asc'
    });


  readonly situacoes = [
    { valor: '', rotulo: 'Todos' },
    { valor: 'ATIVO', rotulo: 'Ativos' },
    { valor: 'INATIVO', rotulo: 'Inativos' },
    { valor: 'VENDIDO', rotulo: 'Vendidos' },
    { valor: 'MORTO', rotulo: 'Mortos' }
  ];


  readonly opcoesOrdenacao = [
    { valor: 'identificacao:asc', rotulo: 'Identificação (A–Z)' },
    { valor: 'pesoAtual:desc', rotulo: 'Mais pesados' },
    { valor: 'pesoAtual:asc', rotulo: 'Mais leves' },
    { valor: 'idadeMeses:desc', rotulo: 'Mais velhos' },
    { valor: 'idadeMeses:asc', rotulo: 'Mais novos' }
  ];


  readonly valorOrdenacao =
    computed(() => {

      const { campo, direcao } =
        this.ordenacao();

      return `${campo}:${direcao}`;

    });


  readonly resumo =
    computed(() => {

      const lista = this.animais();

      const ativos =
        lista.filter(
          animal => animal.situacao === 'ATIVO'
        );

      const pesoMedio =
        ativos.length > 0
          ? ativos.reduce(
              (soma, animal) =>
                soma + animal.pesoAtual,
              0
            ) / ativos.length
          : null;

      return {
        total: lista.length,
        ativos: ativos.length,
        pesoMedio
      };

    });


  readonly contagemSituacao =
    computed(() => {

      const contagem:
        Record<string, number> = {};

      for (const animal of this.animais()) {

        contagem[animal.situacao] =
          (contagem[animal.situacao] ?? 0) + 1;

      }

      return contagem;

    });


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


      const { campo, direcao } =
        this.ordenacao();

      const fator =
        direcao === 'asc' ? 1 : -1;


      return this.animais()
        .filter(animal => {

          const correspondeBusca =
            !busca ||
            animal.identificacao
              .toLowerCase()
              .includes(busca) ||
            animal.raca
              .toLowerCase()
              .includes(busca) ||
            (animal.rebanhoNome ?? '')
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

        })

        .sort(
          (a, b) =>
            fator * this.comparar(a, b, campo)
        );

    });


  // ========================================
  // MODAL
  // ========================================

  modalAberto =
    signal(false);


  readonly hoje =
    new Date(
      Date.now() -
      new Date().getTimezoneOffset() * 60000
    )
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
           * mudamos de propriedade. */
          this.busca.set('');

          const rebanhoDaUrl =
            this.rebanhoInicial;

          this.rebanhoInicial = null;

          this.filtroRebanho.set(
            rebanhoDaUrl &&
            response.rebanhos.some(
              rebanho =>
                rebanho.id === rebanhoDaUrl
            )
              ? rebanhoDaUrl
              : ''
          );

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

    this.focar('identificacao');

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


          this.rebanhos.update(
            lista =>
              lista.map(rebanho =>
                rebanho.id === animal.rebanhoId
                  ? {
                      ...rebanho,
                      quantidadeAnimais:
                        rebanho.quantidadeAnimais + 1
                    }
                  : rebanho
              )
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


  // Esc fecha o modal
  @HostListener('document:keydown.escape')
  onEscape(): void {

    if (this.modalAberto()) {

      this.fecharModal();

    }

  }


  // ========================================
  // ORDENAÇÃO E CHIPS
  // ========================================

  ordenar(
    campo: CampoOrdenacao
  ): void {

    this.ordenacao.update(atual => ({

      campo,

      direcao:
        atual.campo === campo &&
        atual.direcao === 'asc'
          ? 'desc'
          : 'asc'

    }));

  }


  ordenarPorSelect(
    event: Event
  ): void {

    const valor =
      (event.target as HTMLSelectElement)
        .value;

    const [campo, direcao] =
      valor.split(':') as [
        CampoOrdenacao,
        DirecaoOrdenacao
      ];

    this.ordenacao.set({
      campo,
      direcao
    });

  }


  ariaSort(
    campo: CampoOrdenacao
  ): 'ascending' | 'descending' | 'none' {

    const atual = this.ordenacao();

    if (atual.campo !== campo) {
      return 'none';
    }

    return atual.direcao === 'asc'
      ? 'ascending'
      : 'descending';

  }


  iconeOrdem(
    campo: CampoOrdenacao
  ): string {

    const atual = this.ordenacao();

    if (atual.campo !== campo) {
      return 'unfold_more';
    }

    return atual.direcao === 'asc'
      ? 'arrow_upward'
      : 'arrow_downward';

  }


  definirSituacao(
    valor: string
  ): void {

    this.filtroSituacao.set(valor);

  }


  contar(
    situacao: string
  ): number {

    return situacao
      ? this.contagemSituacao()[situacao] ?? 0
      : this.animais().length;

  }


  private comparar(
    a: AnimalResponse,
    b: AnimalResponse,
    campo: CampoOrdenacao
  ): number {

    if (campo === 'identificacao') {

      return a.identificacao.localeCompare(
        b.identificacao,
        'pt-BR',
        { numeric: true }
      );

    }

    return a[campo] - b[campo];

  }


  private focar(id: string): void {

    setTimeout(() =>
      document.getElementById(id)?.focus()
    );

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