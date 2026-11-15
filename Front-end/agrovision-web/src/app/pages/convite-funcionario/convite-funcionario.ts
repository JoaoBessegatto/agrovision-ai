import {
  Component,
  inject,
  OnInit,
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
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  finalize
} from 'rxjs';

import {
  MatIconModule
} from '@angular/material/icon';

import {
  AuthService
} from '../../core/auth/services/auth.service';

import {
  FuncionarioService
} from '../../core/funcionario/services/funcionario.service';

import {
  ConviteFuncionarioPublicoResponse
} from '../../core/funcionario/models/convite-funcionario';

@Component({
  selector: 'app-convite-funcionario',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule
  ],

  templateUrl: './convite-funcionario.html',
  styleUrl: './convite-funcionario.scss'
})
export class ConviteFuncionario
  implements OnInit {

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly formBuilder =
    inject(FormBuilder);

  private readonly authService =
    inject(AuthService);

  private readonly funcionarioService =
    inject(FuncionarioService);


  readonly convite =
    signal<ConviteFuncionarioPublicoResponse | null>(
      null
    );

  readonly loading =
    signal(true);

  readonly processando =
    signal(false);

  readonly errorMessage =
    signal('');

  readonly sucesso =
    signal(false);


  readonly cadastroForm =
    this.formBuilder.nonNullable.group({

      name: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(120)
        ]
      ],

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(100)
        ]
      ]

    });


  private token = '';


  ngOnInit(): void {

    this.token =
      this.route.snapshot.queryParamMap
        .get('token')
        ?.trim() ?? '';

    if (!this.token) {

      this.loading.set(false);

      this.errorMessage.set(
        'O link de convite está incompleto ou inválido.'
      );

      return;
    }

    this.carregarConvite();
  }


  get autenticado(): boolean {

    return this.authService
      .isAuthenticated();
  }


  entrarParaAceitar(): void {

    const returnUrl =
      this.router.url;

    this.router.navigate(
      ['/login'],
      {
        queryParams: {
          returnUrl
        }
      }
    );
  }


  aceitarContaExistente(): void {

    if (
      !this.autenticado ||
      this.processando()
    ) {
      return;
    }

    this.processando.set(true);
    this.errorMessage.set('');

    this.funcionarioService
      .aceitarConvite(this.token)

      .pipe(
        finalize(() =>
          this.processando.set(false)
        )
      )

      .subscribe({

        next: () => {

          this.sucesso.set(true);

          setTimeout(() => {
            this.router.navigate([
              '/app'
            ]);
          }, 700);
        },

        error: error => {

          this.errorMessage.set(
            this.extrairMensagemErro(
              error,
              'Não foi possível aceitar o convite.'
            )
          );
        }

      });
  }


  cadastrarEAceitar(): void {

    if (
      this.cadastroForm.invalid ||
      this.processando()
    ) {

      this.cadastroForm
        .markAllAsTouched();

      return;
    }

    this.processando.set(true);
    this.errorMessage.set('');

    const form =
      this.cadastroForm
        .getRawValue();

    this.funcionarioService
      .cadastrarPorConvite({

        token: this.token,

        name:
          form.name.trim(),

        password:
          form.password

      })

      .pipe(
        finalize(() =>
          this.processando.set(false)
        )
      )

      .subscribe({

        next: () => {

          this.sucesso.set(true);

          setTimeout(() => {

            this.router.navigate(
              ['/login'],
              {
                queryParams: {
                  cadastrado: true
                }
              }
            );

          }, 700);
        },

        error: error => {

          this.errorMessage.set(
            this.extrairMensagemErro(
              error,
              'Não foi possível criar sua conta pelo convite.'
            )
          );
        }

      });
  }


  private carregarConvite(): void {

    this.loading.set(true);
    this.errorMessage.set('');

    this.funcionarioService
      .consultarConvite(
        this.token
      )

      .pipe(
        finalize(() =>
          this.loading.set(false)
        )
      )

      .subscribe({

        next: convite => {

          this.convite.set(
            convite
          );
        },

        error: error => {

          this.convite.set(null);

          this.errorMessage.set(
            this.extrairMensagemErro(
              error,
              'Este convite não está mais disponível.'
            )
          );
        }

      });
  }


  private extrairMensagemErro(
    error: any,
    fallback: string
  ): string {

    if (
      error?.error?.message
    ) {
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
