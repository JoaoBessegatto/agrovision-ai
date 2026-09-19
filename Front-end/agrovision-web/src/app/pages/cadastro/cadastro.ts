import {
  Component,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';

import {
  Router,
  RouterLink
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
  RegisterRequest
} from '../../core/auth/models/register-request';


function passwordsMatchValidator(): ValidatorFn {

  return (
    control: AbstractControl
  ): ValidationErrors | null => {

    const password =
      control.get('password')?.value;

    const confirmPassword =
      control.get('confirmPassword')?.value;


    if (!password || !confirmPassword) {
      return null;
    }


    return password === confirmPassword
      ? null
      : { passwordMismatch: true };

  };

}


@Component({
  selector: 'app-cadastro',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatIconModule
  ],

  templateUrl: './cadastro.html',
  styleUrl: './cadastro.scss'
})
export class CadastroComponent {

  private readonly formBuilder =
    inject(FormBuilder);

  private readonly authService =
    inject(AuthService);

  private readonly router =
    inject(Router);


  loading = signal(false);

  errorMessage = signal('');


  showPassword = false;

  showConfirmPassword = false;


  private errorTimeout?:
    ReturnType<typeof setTimeout>;


  cadastroForm =
    this.formBuilder.nonNullable.group({

      name: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100)
        ]
      ],

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
      ],

      confirmPassword: [
        '',
        [
          Validators.required
        ]
      ],

      acceptTerms: [
        false,
        [
          Validators.requiredTrue
        ]
      ]

    }, {

      validators:
        passwordsMatchValidator()

    });


  get passwordMismatch(): boolean {

    return (
      this.cadastroForm
        .hasError('passwordMismatch') &&

      this.cadastroForm
        .controls
        .confirmPassword
        .touched
    );

  }


  onSubmit(): void {

    this.clearError();


    if (this.cadastroForm.invalid) {

      this.cadastroForm.markAllAsTouched();

      return;

    }


    this.loading.set(true);


    const form =
      this.cadastroForm.getRawValue();


    const request: RegisterRequest = {

      name:
        form.name.trim(),

      email:
        form.email
          .trim()
          .toLowerCase(),

      password:
        form.password

    };


    this.authService
      .register(request)

      .pipe(

        finalize(() => {

          this.loading.set(false);

        })

      )

      .subscribe({

        next: () => {

          this.router.navigate(
            ['/login'],
            {
              queryParams: {
                cadastrado: 'true'
              }
            }
          );

        },


        error: (error) => {

          console.error(
            'Erro ao cadastrar usuário:',
            error
          );


          const backendMessage =
            error?.error?.message;


          if (backendMessage) {

            this.showErrorMessage(
              backendMessage
            );

            return;

          }


          if (error.status === 409) {

            this.showErrorMessage(
              'Já existe uma conta cadastrada com esse e-mail.'
            );

          } else if (error.status === 400) {

            this.showErrorMessage(
              'Verifique os dados informados.'
            );

          } else if (error.status === 0) {

            this.showErrorMessage(
              'Não foi possível conectar ao servidor.'
            );

          } else {

            this.showErrorMessage(
              'Não foi possível criar sua conta. Tente novamente.'
            );

          }

        }

      });

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


  private showErrorMessage(
    message: string
  ): void {

    this.errorMessage.set(
      message
    );


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

}