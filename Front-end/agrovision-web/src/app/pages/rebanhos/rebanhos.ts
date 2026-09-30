import {
  Component,
  effect,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';

import { finalize } from 'rxjs';

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
  RebanhoRequest
} from '../../core/rebanho/models/rebanho-request';


@Component({
  selector: 'app-rebanhos',

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule
  ],

  templateUrl: './rebanhos.html',
  styleUrl: './rebanhos.scss'
})
export class Rebanhos {

  private readonly formBuilder =
    inject(FormBuilder);

  private readonly rebanhoService =
    inject(RebanhoService);

  readonly fazendaContext =
    inject(FazendaContextService);


  // ========================================
  // ESTADO
  // ========================================

  rebanhos =
    signal<RebanhoResponse[]>([]);

  loading =
    signal(false);

  salvando =
    signal(false);

  excluindo =
    signal(false);

  errorMessage =
    signal('');


  // ========================================
  // MODAL CADASTRO / EDIÇÃO
  // ========================================

  modalAberto =
    signal(false);

  editando =
    signal(false);

  rebanhoEditando =
    signal<RebanhoResponse | null>(null);


  // ========================================
  // MODAL EXCLUSÃO
  // ========================================

  rebanhoParaExcluir =
    signal<RebanhoResponse | null>(null);


  // ========================================
  // FORM
  // ========================================

  rebanhoForm =
    this.formBuilder.nonNullable.group({

      nome: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100)
        ]
      ],

      descricao: [
        '',
        [
          Validators.maxLength(500)
        ]
      ]

    });


  constructor() {

    /*
     * Toda vez que a fazenda ativa mudar,
     * os rebanhos são carregados novamente.
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


  // ========================================
  // CARREGAR
  // ========================================

  carregarRebanhos(
    fazendaId: string
  ): void {

    this.loading.set(true);

    this.errorMessage.set('');


    this.rebanhoService
      .listarPorFazenda(fazendaId)

      .pipe(

        finalize(() => {

          this.loading.set(false);

        })

      )

      .subscribe({

        next: rebanhos => {

          /*
           * Evita colocar na tela uma resposta
           * antiga se o usuário trocou rapidamente
           * de fazenda.
           */
          if (
            this.fazendaContext
              .fazendaAtivaId() !== fazendaId
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

          this.errorMessage.set(
            'Não foi possível carregar os rebanhos desta fazenda.'
          );

        }

      });

  }


  // ========================================
  // NOVO REBANHO
  // ========================================

  abrirNovoRebanho(): void {

    if (
      !this.fazendaContext
        .fazendaAtivaId()
    ) {

      this.errorMessage.set(
        'Selecione uma fazenda antes de cadastrar um rebanho.'
      );

      return;
    }


    this.editando.set(false);

    this.rebanhoEditando.set(null);


    this.rebanhoForm.reset({
      nome: '',
      descricao: ''
    });


    this.modalAberto.set(true);

  }


  // ========================================
  // EDITAR
  // ========================================

  abrirEdicao(
    rebanho: RebanhoResponse
  ): void {

    this.editando.set(true);

    this.rebanhoEditando.set(
      rebanho
    );


    this.rebanhoForm.setValue({

      nome:
        rebanho.nome,

      descricao:
        rebanho.descricao ?? ''

    });


    this.modalAberto.set(true);

  }


  // ========================================
  // FECHAR MODAL
  // ========================================

  fecharModal(): void {

    if (this.salvando()) {
      return;
    }


    this.modalAberto.set(false);

    this.editando.set(false);

    this.rebanhoEditando.set(null);


    this.rebanhoForm.reset({
      nome: '',
      descricao: ''
    });

  }


  // ========================================
  // SALVAR
  // ========================================

  salvar(): void {

    this.errorMessage.set('');


    if (
      this.rebanhoForm.invalid
    ) {

      this.rebanhoForm
        .markAllAsTouched();

      return;
    }


    const fazendaId =
      this.fazendaContext
        .fazendaAtivaId();


    if (!fazendaId) {

      this.errorMessage.set(
        'Nenhuma fazenda selecionada.'
      );

      return;
    }


    const form =
      this.rebanhoForm
        .getRawValue();


    const request: RebanhoRequest = {

      nome:
        form.nome.trim(),

      descricao:
        form.descricao.trim()
          ? form.descricao.trim()
          : null,

      fazendaId

    };


    this.salvando.set(true);


    const rebanhoAtual =
      this.rebanhoEditando();


    const requisicao =
      this.editando() &&
      rebanhoAtual

        ? this.rebanhoService
            .atualizar(
              rebanhoAtual.id,
              request
            )

        : this.rebanhoService
            .cadastrar(
              request
            );


    requisicao

      .pipe(

        finalize(() => {

          this.salvando.set(false);

        })

      )

      .subscribe({

        next: () => {

          this.modalAberto.set(false);

          this.editando.set(false);

          this.rebanhoEditando.set(null);


          this.rebanhoForm.reset({
            nome: '',
            descricao: ''
          });


          const fazendaAtualId =
            this.fazendaContext
              .fazendaAtivaId();


          if (fazendaAtualId) {

            this.carregarRebanhos(
              fazendaAtualId
            );

          }

        },


        error: error => {

          console.error(
            'Erro ao salvar rebanho:',
            error
          );


          this.errorMessage.set(
            this.extrairMensagemErro(
              error,
              'Não foi possível salvar o rebanho.'
            )
          );

        }

      });

  }


  // ========================================
  // EXCLUSÃO
  // ========================================

  solicitarExclusao(
    rebanho: RebanhoResponse
  ): void {

    /*
     * Já conseguimos bloquear visualmente
     * antes de fazer a requisição.
     */
    if (
      rebanho.quantidadeAnimais > 0
    ) {

      this.errorMessage.set(
        'Este rebanho possui animais e não pode ser excluído.'
      );

      return;
    }


    this.rebanhoParaExcluir.set(
      rebanho
    );

  }


  cancelarExclusao(): void {

    if (this.excluindo()) {
      return;
    }

    this.rebanhoParaExcluir.set(
      null
    );

  }


  confirmarExclusao(): void {

    const rebanho =
      this.rebanhoParaExcluir();


    if (!rebanho) {
      return;
    }


    this.excluindo.set(true);

    this.errorMessage.set('');


    this.rebanhoService
      .deletar(rebanho.id)

      .pipe(

        finalize(() => {

          this.excluindo.set(false);

        })

      )

      .subscribe({

        next: () => {

          this.rebanhoParaExcluir
            .set(null);


          /*
           * Atualização instantânea da UI.
           */
          this.rebanhos.update(
            lista =>
              lista.filter(
                item =>
                  item.id !== rebanho.id
              )
          );

        },


        error: error => {

          console.error(
            'Erro ao excluir rebanho:',
            error
          );


          this.errorMessage.set(
            this.extrairMensagemErro(
              error,
              'Não foi possível excluir o rebanho.'
            )
          );


          this.rebanhoParaExcluir
            .set(null);

        }

      });

  }


  // ========================================
  // ERRO
  // ========================================

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