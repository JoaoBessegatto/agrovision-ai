import {
  Component,
  effect,
  inject,
  signal
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  MatIconModule
} from '@angular/material/icon';

import {
  finalize
} from 'rxjs';

import {
  AnimalService
} from '../../core/animal/services/animal.service';

import {
  AnimalResponse
} from '../../core/animal/models/animal-response';

import {
  FazendaContextService
} from '../../core/fazenda/services/fazenda-context.service';

import {
  RebanhoService
} from '../../core/rebanho/services/rebanho.service';

import {
  RebanhoResponse
} from '../../core/rebanho/models/rebanho-response';

import {
  RegistroPesoService
} from '../../core/pesagem/services/registro-peso.service';

import {
  RegistroPesoResponse
} from '../../core/pesagem/models/registro-peso-response';


@Component({
  selector: 'app-animal-detalhes',

  standalone: true,

  imports: [
    CommonModule,
    MatIconModule,
    ReactiveFormsModule
  ],

  templateUrl: './animal-detalhes.html',
  styleUrl: './animal-detalhes.scss'
})
export class AnimalDetalhes {

  // =========================================================
  // DEPENDÊNCIAS
  // =========================================================

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly animalService =
    inject(AnimalService);

  private readonly rebanhoService =
    inject(RebanhoService);

  private readonly registroPesoService =
    inject(RegistroPesoService);

  private readonly formBuilder =
    inject(FormBuilder);

  readonly fazendaContext =
    inject(FazendaContextService);


  // =========================================================
  // IDENTIFICAÇÃO DO ANIMAL
  // =========================================================

  private readonly animalId: string;


  // =========================================================
  // ESTADO DO ANIMAL
  // =========================================================

  animal =
    signal<AnimalResponse | null>(null);

  loading =
    signal(true);

  alterandoStatus =
    signal(false);

  errorMessage =
    signal('');


  // =========================================================
  // REBANHOS
  // =========================================================

  rebanhos =
    signal<RebanhoResponse[]>([]);

  carregandoRebanhos =
    signal(false);


  // =========================================================
  // TRANSFERÊNCIA
  // =========================================================

  modalTransferencia =
    signal(false);

  novoRebanhoId =
    signal('');

  transferindo =
    signal(false);


  // =========================================================
  // PESAGENS
  // =========================================================

  pesagens =
    signal<RegistroPesoResponse[]>([]);

  loadingPesagens =
    signal(false);

  modalPesagem =
    signal(false);

  salvandoPesagem =
    signal(false);


  // =========================================================
  // FORMULÁRIO DE PESAGEM
  // =========================================================

  pesagemForm =
    this.formBuilder.group({

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
  // CONSTRUTOR
  // =========================================================

  constructor() {

    const id =
      this.route.snapshot
        .paramMap
        .get('id');


    if (!id) {

      this.animalId = '';

      this.router.navigate([
        '/app/animais'
      ]);

      return;
    }


    this.animalId = id;


    /*
     * Carrega os dados principais
     * do animal.
     */
    this.carregarAnimal();


    /*
     * Sempre que a fazenda ativa mudar,
     * recarregamos os rebanhos disponíveis.
     *
     * Eles são utilizados principalmente
     * na transferência do animal.
     */
    effect(() => {

      const fazendaId =
        this.fazendaContext
          .fazendaAtivaId();


      if (!fazendaId) {

        this.rebanhos.set([]);

        return;
      }


      this.carregarRebanhos(
        fazendaId
      );

    });

  }


  // =========================================================
  // CARREGAR ANIMAL
  // =========================================================

  carregarAnimal(): void {

    if (!this.animalId) {
      return;
    }


    this.loading.set(true);

    this.errorMessage.set('');


    this.animalService
      .buscarPorId(
        this.animalId
      )

      .pipe(

        finalize(() => {

          this.loading.set(false);

        })

      )

      .subscribe({

        next: animal => {

          this.animal.set(
            animal
          );


          /*
           * Depois que sabemos que o
           * animal existe e pode ser
           * acessado, carregamos seu
           * histórico de pesagens.
           */
          this.carregarPesagens();

        },


        error: error => {

          console.error(
            'Erro ao carregar animal:',
            error
          );


          this.errorMessage.set(
            this.extrairMensagemErro(
              error,
              'Não foi possível carregar o animal.'
            )
          );

        }

      });

  }


  // =========================================================
  // ATUALIZAR ANIMAL SEM RECARREGAR A TELA
  // =========================================================

  private atualizarAnimalSilenciosamente(): void {

    if (!this.animalId) {
      return;
    }


    this.animalService
      .buscarPorId(
        this.animalId
      )

      .subscribe({

        next: animal => {

          this.animal.set(
            animal
          );

        },


        error: error => {

          console.error(
            'Erro ao atualizar os dados do animal:',
            error
          );

        }

      });

  }


  // =========================================================
  // PESAGENS - CARREGAR HISTÓRICO
  // =========================================================

  carregarPesagens(): void {

    if (!this.animalId) {
      return;
    }


    this.loadingPesagens.set(
      true
    );


    this.registroPesoService
      .listarHistorico(
        this.animalId
      )

      .pipe(

        finalize(() => {

          this.loadingPesagens.set(
            false
          );

        })

      )

      .subscribe({

        next: registros => {

          this.pesagens.set(
            registros
          );

        },


        error: error => {

          console.error(
            'Erro ao carregar pesagens:',
            error
          );


          this.pesagens.set([]);


          this.errorMessage.set(
            this.extrairMensagemErro(
              error,
              'Não foi possível carregar o histórico de pesagens.'
            )
          );

        }

      });

  }


  // =========================================================
  // PESAGENS - ABRIR MODAL
  // =========================================================

  abrirNovaPesagem(): void {

    const animal =
      this.animal();


    if (!animal) {
      return;
    }


    /*
     * Backend também possui essa
     * validação, mas bloqueamos no
     * frontend para melhorar a UX.
     */
    if (
      animal.situacao !== 'ATIVO'
    ) {

      this.errorMessage.set(
        'Somente animais ativos podem receber novas pesagens.'
      );

      return;
    }


    this.errorMessage.set('');


    this.pesagemForm.reset({

      pesoKg: null

    });


    this.modalPesagem.set(
      true
    );

  }


  // =========================================================
  // PESAGENS - FECHAR MODAL
  // =========================================================

  fecharPesagem(): void {

    if (this.salvandoPesagem()) {
      return;
    }


    this.modalPesagem.set(
      false
    );


    this.pesagemForm.reset({

      pesoKg: null

    });

  }


  // =========================================================
  // PESAGENS - REGISTRAR
  // =========================================================

  registrarPesagem(): void {

    this.errorMessage.set('');


    /*
     * Validação do formulário.
     */
    if (
      this.pesagemForm.invalid
    ) {

      this.pesagemForm
        .markAllAsTouched();

      return;
    }


    const animal =
      this.animal();


    if (!animal) {
      return;
    }


    /*
     * Segurança adicional.
     */
    if (
      animal.situacao !== 'ATIVO'
    ) {

      this.modalPesagem.set(
        false
      );


      this.errorMessage.set(
        'Somente animais ativos podem receber novas pesagens.'
      );

      return;
    }


    const form =
      this.pesagemForm
        .getRawValue();


    const pesoKg =
      Number(
        form.pesoKg
      );


    /*
     * Segurança contra NaN,
     * infinito ou valores fora
     * do limite definido.
     */
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


      this.pesagemForm
        .controls
        .pesoKg
        .markAsTouched();

      return;
    }


    this.salvandoPesagem.set(
      true
    );


    this.registroPesoService
      .registrar(
        animal.id,
        {
          pesoKg
        }
      )

      .pipe(

        finalize(() => {

          this.salvandoPesagem.set(
            false
          );

        })

      )

      .subscribe({

        next: registro => {

          /*
           * Fecha o modal.
           */
          this.modalPesagem.set(
            false
          );


          /*
           * O backend retorna o registro
           * recém-criado.
           *
           * Como o histórico vem ordenado
           * do mais recente para o mais
           * antigo, colocamos o registro
           * na primeira posição.
           */
          this.pesagens.update(
            lista => [
              registro,
              ...lista
            ]
          );


          /*
           * O backend também atualiza
           * Animal.pesoAtual.
           *
           * Atualizamos o signal local
           * imediatamente, evitando uma
           * nova chamada apenas para
           * atualizar o card da tela.
           */
          this.animal.update(
            atual => {

              if (!atual) {
                return atual;
              }


              return {

                ...atual,

                pesoAtual:
                  registro.pesoKg

              };

            }
          );


          /*
           * Limpa formulário.
           */
          this.pesagemForm.reset({

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
  // PESAGENS - CALCULAR VARIAÇÃO
  // =========================================================

  calcularVariacao(
    index: number
  ): number | null {

    const registros =
      this.pesagens();


    /*
     * A API retorna:
     *
     * [0] mais recente
     * [1] anterior
     * [2] mais antiga
     *
     * Portanto comparamos a pesagem
     * atual com a próxima posição.
     */
    if (
      index < 0 ||
      index >= registros.length - 1
    ) {

      return null;
    }


    const atual =
      registros[index];


    const anterior =
      registros[index + 1];


    /*
     * Evita problemas visuais de
     * precisão de ponto flutuante.
     */
    const diferenca =
      atual.pesoKg -
      anterior.pesoKg;


    return Number(
      diferenca.toFixed(2)
    );

  }


  // =========================================================
  // REBANHOS
  // =========================================================

  carregarRebanhos(
    fazendaId: string
  ): void {

    this.carregandoRebanhos.set(
      true
    );


    this.rebanhoService
      .listarPorFazenda(
        fazendaId
      )

      .pipe(

        finalize(() => {

          this.carregandoRebanhos.set(
            false
          );

        })

      )

      .subscribe({

        next: rebanhos => {

          /*
           * Evita salvar uma resposta
           * antiga caso o usuário troque
           * de fazenda rapidamente.
           */
          if (
            this.fazendaContext
              .fazendaAtivaId() !==
            fazendaId
          ) {

            return;
          }


          this.rebanhos.set(
            rebanhos
          );

        },


        error: error => {

          console.error(
            'Erro ao carregar rebanhos:',
            error
          );


          this.rebanhos.set([]);

        }

      });

  }


  // =========================================================
  // VOLTAR
  // =========================================================

  voltar(): void {

    this.router.navigate([
      '/app/animais'
    ]);

  }


  // =========================================================
  // ALTERAR STATUS
  // =========================================================

  alterarStatus(): void {

    const animal =
      this.animal();


    if (!animal) {
      return;
    }


    if (
      animal.situacao !== 'ATIVO' &&
      animal.situacao !== 'INATIVO'
    ) {

      return;
    }


    this.alterandoStatus.set(
      true
    );

    this.errorMessage.set('');


    const request =
      animal.situacao === 'ATIVO'

        ? this.animalService
            .inativar(
              animal.id
            )

        : this.animalService
            .ativar(
              animal.id
            );


    request

      .pipe(

        finalize(() => {

          this.alterandoStatus.set(
            false
          );

        })

      )

      .subscribe({

        next: () => {

          /*
           * Alteramos imediatamente no
           * frontend sem precisar mostrar
           * loading da página inteira.
           */
          this.animal.update(
            atual => {

              if (!atual) {
                return atual;
              }


              return {

                ...atual,

                situacao:
                  atual.situacao === 'ATIVO'
                    ? 'INATIVO'
                    : 'ATIVO'

              };

            }
          );

        },


        error: error => {

          console.error(
            'Erro ao alterar situação do animal:',
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


  // =========================================================
  // TRANSFERÊNCIA - ABRIR
  // =========================================================

  abrirTransferencia(): void {

    const animal =
      this.animal();


    if (!animal) {
      return;
    }


    if (
      this.rebanhos().length === 0
    ) {

      this.errorMessage.set(
        'Nenhum rebanho disponível para transferência.'
      );

      return;
    }


    this.errorMessage.set('');


    /*
     * O select inicia apontando
     * para o rebanho atual.
     */
    this.novoRebanhoId.set(
      animal.rebanhoId
    );


    this.modalTransferencia.set(
      true
    );

  }


  // =========================================================
  // TRANSFERÊNCIA - FECHAR
  // =========================================================

  fecharTransferencia(): void {

    if (this.transferindo()) {
      return;
    }


    this.modalTransferencia.set(
      false
    );


    this.novoRebanhoId.set('');

  }


  // =========================================================
  // TRANSFERÊNCIA - ALTERAR SELECT
  // =========================================================

  alterarNovoRebanho(
    event: Event
  ): void {

    const select =
      event.target as HTMLSelectElement;


    this.novoRebanhoId.set(
      select.value
    );

  }


  // =========================================================
  // TRANSFERÊNCIA - CONFIRMAR
  // =========================================================

  confirmarTransferencia(): void {

    const animal =
      this.animal();


    const rebanhoId =
      this.novoRebanhoId();


    if (
      !animal ||
      !rebanhoId
    ) {

      return;
    }


    /*
     * Não faz requisição caso o
     * rebanho continue o mesmo.
     */
    if (
      rebanhoId ===
      animal.rebanhoId
    ) {

      this.fecharTransferencia();

      return;
    }


    /*
     * Procura o rebanho selecionado
     * para conseguirmos atualizar
     * nome e ID localmente.
     */
    const novoRebanho =
      this.rebanhos()
        .find(
          rebanho =>
            rebanho.id ===
            rebanhoId
        );


    if (!novoRebanho) {

      this.errorMessage.set(
        'Rebanho selecionado não foi encontrado.'
      );

      return;
    }


    this.transferindo.set(
      true
    );

    this.errorMessage.set('');


    this.animalService
      .transferir(
        animal.id,
        rebanhoId
      )

      .pipe(

        finalize(() => {

          this.transferindo.set(
            false
          );

        })

      )

      .subscribe({

        next: () => {

          /*
           * Fecha modal.
           */
          this.modalTransferencia.set(
            false
          );


          this.novoRebanhoId.set('');


          /*
           * Atualiza o animal na tela
           * imediatamente.
           */
          this.animal.update(
            atual => {

              if (!atual) {
                return atual;
              }


              return {

                ...atual,

                rebanhoId:
                  novoRebanho.id,

                rebanhoNome:
                  novoRebanho.nome

              };

            }
          );


          /*
           * Atualiza silenciosamente com
           * os dados oficiais do backend.
           */
          this.atualizarAnimalSilenciosamente();

        },


        error: error => {

          console.error(
            'Erro ao transferir animal:',
            error
          );


          this.errorMessage.set(
            this.extrairMensagemErro(
              error,
              'Não foi possível transferir o animal.'
            )
          );

        }

      });

  }


  // =========================================================
  // FORMATAR SEXO
  // =========================================================

  formatarSexo(
    sexo: string
  ): string {

    switch (sexo) {

      case 'MACHO':
        return 'Macho';

      case 'FEMEA':
        return 'Fêmea';

      default:
        return sexo;

    }

  }


  // =========================================================
  // FORMATAR SITUAÇÃO
  // =========================================================

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


  // =========================================================
  // FORMATAR IDADE
  // =========================================================

  formatarIdade(
    meses: number
  ): string {

    if (
      meses === 0
    ) {

      return 'Menos de 1 mês';

    }


    if (
      meses < 12
    ) {

      return meses === 1
        ? '1 mês'
        : `${meses} meses`;

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


    const textoAnos =
      anos === 1
        ? '1 ano'
        : `${anos} anos`;


    const textoMeses =
      mesesRestantes === 1
        ? '1 mês'
        : `${mesesRestantes} meses`;


    return `${textoAnos} e ${textoMeses}`;

  }


  // =========================================================
  // ERRO
  // =========================================================

  limparErro(): void {

    this.errorMessage.set('');

  }


  // =========================================================
  // EXTRAIR MENSAGEM DO BACKEND
  // =========================================================

  private extrairMensagemErro(
    error: any,
    fallback: string
  ): string {

    /*
     * Backend retornando texto puro.
     */
    if (
      typeof error?.error === 'string' &&
      error.error.trim()
    ) {

      return error.error;

    }


    /*
     * Backend retornando:
     *
     * {
     *   "message": "..."
     * }
     */
    if (
      error?.error?.message
    ) {

      return error.error.message;

    }


    /*
     * Alguns handlers usam:
     *
     * {
     *   "mensagem": "..."
     * }
     */
    if (
      error?.error?.mensagem
    ) {

      return error.error.mensagem;

    }


    /*
     * Servidor indisponível.
     */
    if (
      error?.status === 0
    ) {

      return 'Não foi possível conectar ao servidor.';

    }


    /*
     * Não autenticado.
     */
    if (
      error?.status === 401
    ) {

      return 'Sua sessão expirou. Faça login novamente.';

    }


    /*
     * Sem autorização.
     */
    if (
      error?.status === 403
    ) {

      return 'Você não possui permissão para realizar esta operação.';

    }


    /*
     * Recurso inexistente.
     */
    if (
      error?.status === 404
    ) {

      return 'O recurso solicitado não foi encontrado.';

    }


    return fallback;

  }

}