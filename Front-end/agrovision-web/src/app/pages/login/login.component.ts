import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import {
  finalize,
  switchMap,
  tap
} from 'rxjs/operators';

import {
  AuthService
} from '../../core/auth/services/auth.service';

import {
  UsuarioContextService
} from '../../core/user/services/user-context.service';

import {
  FazendaContextService
} from '../../core/fazenda/services/fazenda-context.service';

import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-login',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    RouterLink
  ],

  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  private readonly formBuilder =
    inject(FormBuilder);

  private readonly authService =
    inject(AuthService);

  private readonly usuarioContextService =
    inject(UsuarioContextService);

  private readonly fazendaContext =
    inject(FazendaContextService);

  private readonly router =
    inject(Router);

  private readonly route =
    inject(ActivatedRoute);


  readonly anoAtual =
    new Date().getFullYear();

  readonly contaCriada =
    signal(
      this.route.snapshot.queryParamMap
        .get('cadastrado') === 'true'
    );

  loading = signal(false);

  errorMessage = signal('');

  showPassword = false;


  loginForm =
    this.formBuilder.nonNullable.group({

      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6)
        ]
      ]

    });


  onSubmit(): void {

    this.clearError();

    if (this.loginForm.invalid) {

      this.loginForm.markAllAsTouched();

      return;
    }


    this.loading.set(true);

    const credentials = {

      email:
        this.loginForm.controls.email
          .value
          .trim()
          .toLowerCase(),

      password:
        this.loginForm.controls.password
          .value
    };


    let loginRealizado = false;


    this.authService
      .login(credentials)

      .pipe(

        tap(() => {

          loginRealizado = true;

      
          this.fazendaContext.limpar();
        }),

        switchMap(() =>
          this.usuarioContextService
            .getContexto()
        ),

        finalize(() => {
          this.loading.set(false);
        })

      )

      .subscribe({

        next: contexto => {

      
          const returnUrl =
            this.route.snapshot.queryParamMap
              .get('returnUrl');

          if (
            returnUrl &&
            returnUrl.startsWith(
              '/convite-funcionario'
            )
          ) {

            this.router.navigateByUrl(
              returnUrl
            );

            return;
          }


          if (contexto.admin) {

            this.router.navigate([
              '/app'
            ]);

            return;
          }


     
          if (
            contexto.possuiVinculoFuncionario &&
            !contexto.possuiAcessoFazenda
          ) {

            this.router.navigate([
              '/acesso-suspenso'
            ]);

            return;
          }


     
          if (
            contexto.possuiAcessoFazenda
          ) {

            this.router.navigate([
              '/app'
            ]);

            return;
          }


     
          this.router.navigate([
            '/onboarding'
          ]);
        },


        error: error => {

          console.error(
            'Erro durante o login:',
            error
          );


          if (!loginRealizado) {

            if (
              error.status === 401 ||
              error.status === 400
            ) {

              this.showErrorMessage(
                'E-mail ou senha incorretos. Verifique e tente novamente.'
              );

            } else if (
              error.status === 0
            ) {

              this.showErrorMessage(
                'Não foi possível conectar ao servidor. Verifique sua conexão.'
              );

            } else {

              this.showErrorMessage(
                'Não foi possível realizar o login. Tente novamente.'
              );
            }

            return;
          }


          if (error.status === 0) {

            this.showErrorMessage(
              'Login realizado, mas não foi possível carregar os dados da sua conta.'
            );

          } else if (
            error.status === 401 ||
            error.status === 403
          ) {

            this.authService.logout();

            this.showErrorMessage(
              'Não foi possível validar sua sessão. Entre novamente.'
            );

          } else {

            this.showErrorMessage(
              'Login realizado, mas ocorreu um erro ao carregar sua conta.'
            );
          }
        }

      });
  }


  private showErrorMessage(
    message: string
  ): void {

    this.errorMessage.set(message);
  }


  clearError(): void {

    this.errorMessage.set('');

    this.contaCriada.set(false);
  }
}
