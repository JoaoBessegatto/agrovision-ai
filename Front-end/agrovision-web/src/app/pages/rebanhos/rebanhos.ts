import {
  Component,
  computed,
  effect,
  HostListener,
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

import { RouterLink } from '@angular/router';

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

import {
  VendaRebanhoResponse
} from '../../core/rebanho/models/venda-rebanho-response';


@Component({
  selector: 'app-rebanhos',

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    RouterLink
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



  modalAberto =
    signal(false);

  editando =
    signal(false);

  rebanhoEditando =
    signal<RebanhoResponse | null>(null);

  rebanhoVendaSelecionado =
  signal<RebanhoResponse | null>(null);

  modalVendaRebanho =
    signal(false);

  vendendoRebanho =
    signal(false);

  resultadoVenda =
    signal<VendaRebanhoResponse | null>(null);

  
  rebanhoParaExcluir =
    signal<RebanhoResponse | null>(null);


 
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


  readonly totalAnimais =
    computed(() =>
      this.rebanhos().reduce(
        (soma, rebanho) =>
          soma + rebanho.quantidadeAnimais,
        0
      )
    );


  constructor() {

  
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

    this.focar('nome');

  }


  
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

    this.focar('nome');

  }


  
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


  solicitarExclusao(
    rebanho: RebanhoResponse
  ): void {

  
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

  abrirVendaRebanho(
    rebanho: RebanhoResponse
    ): void {

  this.rebanhoVendaSelecionado.set(
    rebanho
  );

  this.resultadoVenda.set(null);

  this.modalVendaRebanho.set(true); 
  
  }

  fecharVendaRebanho(): void {

    if (this.vendendoRebanho()) {
      return;
  }

  this.modalVendaRebanho.set(false);

  this.rebanhoVendaSelecionado.set(null);

  this.resultadoVenda.set(null);
  
  }
  
  confirmarVendaRebanho(): void {

  const rebanho =
    this.rebanhoVendaSelecionado();

  if (!rebanho) {
    return;
  }

  this.vendendoRebanho.set(true);

  this.errorMessage.set('');


  this.rebanhoService
    .venderRebanho(
      rebanho.id
    )

    .pipe(
      finalize(() => {
        this.vendendoRebanho.set(false);
      })
    )

    .subscribe({

      next: resultado => {

        this.resultadoVenda.set(
          resultado
        );


        const fazendaId =
          this.fazendaContext
            .fazendaAtivaId();

        if (fazendaId) {
          this.carregarRebanhos(
            fazendaId
          );
        }

      },


      error: error => {

        this.errorMessage.set(
          this.extrairMensagemErro(
            error,
            'Não foi possível realizar a venda do rebanho.'
          )
        );

      }

    });
  }


  @HostListener('document:keydown.escape')
  onEscape(): void {

    if (this.rebanhoParaExcluir()) {

      this.cancelarExclusao();

    } else if (this.modalAberto()) {

      this.fecharModal();

    }

  }


  participacao(
    rebanho: RebanhoResponse
  ): number {

    const total = this.totalAnimais();

    return total > 0
      ? Math.round(
          (rebanho.quantidadeAnimais / total) * 100
        )
      : 0;

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