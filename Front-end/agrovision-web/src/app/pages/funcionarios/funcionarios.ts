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
  finalize,
  forkJoin
} from 'rxjs';

import {
  FazendaContextService
} from '../../core/fazenda/services/fazenda-context.service';

import {
  FuncionarioService
} from '../../core/funcionario/services/funcionario.service';

import {
  CargoFuncionario,
  FuncionarioResponse
} from '../../core/funcionario/models/funcionario-response';

import {
  ConviteFuncionarioResponse
} from '../../core/funcionario/models/convite-funcionario';

@Component({
  selector: 'app-funcionarios',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule
  ],

  templateUrl: './funcionarios.html',
  styleUrl: './funcionarios.scss'
})
export class Funcionarios {

  private readonly formBuilder =
    inject(FormBuilder);

  private readonly funcionarioService =
    inject(FuncionarioService);

  readonly fazendaContext =
    inject(FazendaContextService);


  readonly funcionarios =
    signal<FuncionarioResponse[]>([]);

  readonly convites =
    signal<ConviteFuncionarioResponse[]>([]);

  readonly loading =
    signal(false);

  readonly processando =
    signal(false);

  readonly modalConviteAberto =
    signal(false);

  readonly errorMessage =
    signal('');

  readonly successMessage =
    signal('');


  readonly cargos: {
    value: CargoFuncionario;
    label: string;
    descricao: string;
  }[] = [
    {
      value: 'GERENTE',
      label: 'Gerente',
      descricao:
        'Gerencia rebanhos, animais e operações da propriedade.'
    },
    {
      value: 'TRATADOR',
      label: 'Tratador',
      descricao:
        'Consulta o plantel e registra pesagens.'
    },
    {
      value: 'VETERINARIO',
      label: 'Veterinário',
      descricao:
        'Consulta animais, registra pesagens e ocorrências de morte.'
    }
  ];


  readonly conviteForm =
    this.formBuilder.nonNullable.group({

      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],

      cargo: [
        'TRATADOR' as CargoFuncionario,
        [
          Validators.required
        ]
      ]

    });


  readonly ativos =
    computed(() =>
      this.funcionarios()
        .filter(item => item.ativo)
        .length
    );

  readonly inativos =
    computed(() =>
      this.funcionarios()
        .filter(item => !item.ativo)
        .length
    );

  readonly convitesPendentes =
    computed(() =>
      this.convites()
        .filter(
          item =>
            item.status === 'PENDENTE'
        )
        .length
    );


  constructor() {

    effect(() => {

      const fazendaId =
        this.fazendaContext
          .fazendaAtivaId();

      if (!fazendaId) {

        this.funcionarios.set([]);
        this.convites.set([]);

        return;
      }


      if (
        !this.fazendaContext
          .podeGerenciarFuncionarios()
      ) {

        this.funcionarios.set([]);
        this.convites.set([]);

        return;
      }


      this.carregar(
        fazendaId
      );
    });
  }


  abrirConvite(): void {

    if (
      !this.fazendaContext
        .podeGerenciarFuncionarios()
    ) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');

    this.conviteForm.reset({
      email: '',
      cargo: 'TRATADOR'
    });

    this.modalConviteAberto.set(true);
  }


  fecharConvite(): void {

    if (this.processando()) {
      return;
    }

    this.modalConviteAberto.set(false);
  }


  enviarConvite(): void {

    if (
      this.conviteForm.invalid ||
      this.processando()
    ) {

      this.conviteForm
        .markAllAsTouched();

      return;
    }


    const fazendaId =
      this.fazendaContext
        .fazendaAtivaId();

    if (!fazendaId) {
      return;
    }


    const form =
      this.conviteForm
        .getRawValue();

    this.processando.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');


    this.funcionarioService
      .convidar({

        email:
          form.email
            .trim()
            .toLowerCase(),

        fazendaId,

        cargo:
          form.cargo

      })

      .pipe(
        finalize(() =>
          this.processando.set(false)
        )
      )

      .subscribe({

        next: convite => {

          this.convites.update(
            lista => [
              convite,
              ...lista
            ]
          );

          this.modalConviteAberto.set(false);

          this.successMessage.set(
            'Convite enviado com sucesso.'
          );
        },

        error: error => {

          this.errorMessage.set(
            this.extrairMensagemErro(
              error,
              'Não foi possível enviar o convite.'
            )
          );
        }

      });
  }


  alterarCargo(
    funcionario: FuncionarioResponse,
    event: Event
  ): void {

    const cargo =
      (event.target as HTMLSelectElement)
        .value as CargoFuncionario;

    if (
      cargo === funcionario.cargo
    ) {
      return;
    }

    this.processando.set(true);
    this.errorMessage.set('');


    this.funcionarioService
      .alterarCargo(
        funcionario.id,
        cargo
      )

      .pipe(
        finalize(() =>
          this.processando.set(false)
        )
      )

      .subscribe({

        next: atualizado => {

          this.funcionarios.update(
            lista =>
              lista.map(item =>
                item.id === atualizado.id
                  ? atualizado
                  : item
              )
          );

          this.successMessage.set(
            'Cargo atualizado.'
          );
        },

        error: error => {

          this.errorMessage.set(
            this.extrairMensagemErro(
              error,
              'Não foi possível alterar o cargo.'
            )
          );

          this.recarregar();
        }

      });
  }


  alternarStatus(
    funcionario: FuncionarioResponse
  ): void {

    if (this.processando()) {
      return;
    }

    this.processando.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');


    const requisicao =
      funcionario.ativo

        ? this.funcionarioService
            .desativar(
              funcionario.id
            )

        : this.funcionarioService
            .ativar(
              funcionario.id
            );


    requisicao

      .pipe(
        finalize(() =>
          this.processando.set(false)
        )
      )

      .subscribe({

        next: () => {

          this.funcionarios.update(
            lista =>
              lista.map(item =>

                item.id === funcionario.id

                  ? {
                      ...item,
                      ativo: !item.ativo
                    }

                  : item
              )
          );

          this.successMessage.set(
            funcionario.ativo
              ? 'Acesso do funcionário suspenso.'
              : 'Acesso do funcionário reativado.'
          );
        },

        error: error => {

          this.errorMessage.set(
            this.extrairMensagemErro(
              error,
              'Não foi possível alterar o status do funcionário.'
            )
          );
        }

      });
  }


  reenviar(
    convite: ConviteFuncionarioResponse
  ): void {

    if (this.processando()) {
      return;
    }

    this.processando.set(true);
    this.errorMessage.set('');


    this.funcionarioService
      .reenviarConvite(
        convite.id
      )

      .pipe(
        finalize(() =>
          this.processando.set(false)
        )
      )

      .subscribe({

        next: atualizado => {

          this.convites.update(
            lista =>
              lista.map(item =>
                item.id === atualizado.id
                  ? atualizado
                  : item
              )
          );

          this.successMessage.set(
            'Convite reenviado.'
          );
        },

        error: error => {

          this.errorMessage.set(
            this.extrairMensagemErro(
              error,
              'Não foi possível reenviar o convite.'
            )
          );
        }

      });
  }


  cancelar(
    convite: ConviteFuncionarioResponse
  ): void {

    if (this.processando()) {
      return;
    }

    this.processando.set(true);
    this.errorMessage.set('');


    this.funcionarioService
      .cancelarConvite(
        convite.id
      )

      .pipe(
        finalize(() =>
          this.processando.set(false)
        )
      )

      .subscribe({

        next: () => {

          this.convites.update(
            lista =>
              lista.map(item =>

                item.id === convite.id

                  ? {
                      ...item,
                      status: 'CANCELADO'
                    }

                  : item
              )
          );

          this.successMessage.set(
            'Convite cancelado.'
          );
        },

        error: error => {

          this.errorMessage.set(
            this.extrairMensagemErro(
              error,
              'Não foi possível cancelar o convite.'
            )
          );
        }

      });
  }


  labelCargo(
    cargo: string
  ): string {

    return this.cargos
      .find(
        item =>
          item.value === cargo
      )
      ?.label ?? cargo;
  }


  labelStatusConvite(
    status: ConviteFuncionarioResponse['status']
  ): string {

    const labels = {
      PENDENTE: 'Pendente',
      ACEITO: 'Aceito',
      EXPIRADO: 'Expirado',
      CANCELADO: 'Cancelado'
    };

    return labels[status];
  }


  recarregar(): void {

    const fazendaId =
      this.fazendaContext
        .fazendaAtivaId();

    if (
      fazendaId &&
      this.fazendaContext
        .podeGerenciarFuncionarios()
    ) {

      this.carregar(
        fazendaId
      );
    }
  }


  limparMensagens(): void {

    this.errorMessage.set('');
    this.successMessage.set('');
  }


  private carregar(
    fazendaId: string
  ): void {

    this.loading.set(true);
    this.errorMessage.set('');


    forkJoin({

      funcionarios:
        this.funcionarioService
          .listarPorFazenda(
            fazendaId
          ),

      convites:
        this.funcionarioService
          .listarConvites(
            fazendaId
          )

    })

      .pipe(
        finalize(() =>
          this.loading.set(false)
        )
      )

      .subscribe({

        next: resultado => {

          if (
            this.fazendaContext
              .fazendaAtivaId() !==
            fazendaId
          ) {
            return;
          }

          this.funcionarios.set(
            resultado.funcionarios
          );

          this.convites.set(
            resultado.convites
          );
        },

        error: error => {

          this.funcionarios.set([]);
          this.convites.set([]);

          this.errorMessage.set(
            this.extrairMensagemErro(
              error,
              'Não foi possível carregar a equipe desta fazenda.'
            )
          );
        }

      });
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

    return fallback;
  }
}
