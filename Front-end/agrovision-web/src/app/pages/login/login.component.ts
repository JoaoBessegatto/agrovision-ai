import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  Router,
  RouterLink
} from '@angular/router';

import {
  finalize,
  switchMap,
  tap
} from 'rxjs/operators';

import { AuthService } from '../../core/auth/services/auth.service';
import { UsuarioContextService } from '../../core/user/services/user-context.service';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    RouterLink
  ],

  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  private readonly formBuilder = inject(FormBuilder);

  private readonly authService =
    inject(AuthService);

  private readonly usuarioContextService =
    inject(UsuarioContextService);

  private readonly router =
    inject(Router);

  private errorTimeout?:
    ReturnType<typeof setTimeout>;

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


    /*
     * Usamos esta variável para saber
     * se o erro aconteceu no LOGIN
     * ou depois, ao carregar o contexto.
     */
    let loginRealizado = false;


    this.authService
      .login(credentials)

      .pipe(

        /*
         * O AuthService já salvou o JWT
         * no localStorage através do tap()
         * que existe dentro dele.
         */
        tap(() => {

          loginRealizado = true;

        }),


        /*
         * Depois do login, buscamos o
         * estado atual do usuário.
         */
        switchMap(() =>

          this.usuarioContextService
            .getContexto()

        ),


        /*
         * Sempre encerra o loading.
         */
        finalize(() => {

          this.loading.set(false);

        })

      )

      .subscribe({

        // ==========================================
        // LOGIN + CONTEXTO CARREGADOS
        // ==========================================

        next: contexto => {

          /*
           * ADMIN não precisa passar
           * pelo onboarding de produtor.
           */
          if (contexto.admin) {

            this.router.navigate([
              '/dashboard'
            ]);

            return;
          }


          /*
           * Usuário ainda não terminou
           * sua configuração.
           */
          if (
            !contexto.possuiPerfilProdutor ||
            !contexto.possuiFazenda
          ) {

            this.router.navigate([
              '/onboarding'
            ]);

            return;
          }


          /*
           * Usuário já possui perfil
           * de produtor e fazenda.
           */
          this.router.navigate([
            '/dashboard'
          ]);

        },


        // ==========================================
        // ERROS
        // ==========================================

        error: error => {

          console.error(
            'Erro durante o login:',
            error
          );


          /*
           * Se nem o login terminou,
           * o problema está na autenticação.
           */
          if (!loginRealizado) {

            if (
              error.status === 401 ||
              error.status === 400
            ) {

              this.showErrorMessage(
                'E-mail ou senha incorretos. Verifique e tente novamente.'
              );

            } else if (error.status === 0) {

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


          /*
           * Se chegou aqui com loginRealizado = true,
           * significa que o login funcionou e o erro
           * aconteceu ao buscar /api/me/context.
           */
          if (error.status === 0) {

            this.showErrorMessage(
              'Login realizado, mas não foi possível carregar os dados da sua conta.'
            );

          } else if (
            error.status === 401 ||
            error.status === 403
          ) {

            /*
             * Token inválido ou rejeitado.
             * Nesse caso limpamos a sessão.
             */
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


    if (this.errorTimeout) {

      clearTimeout(
        this.errorTimeout
      );

    }


    this.errorTimeout =
      setTimeout(() => {

        this.errorMessage.set('');

      }, 6000);

  }


  clearError(): void {

    this.errorMessage.set('');


    if (this.errorTimeout) {

      clearTimeout(
        this.errorTimeout
      );

      this.errorTimeout =
        undefined;

    }

  }

}