import {
  Component,
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
  ProdutorService
} from '../../core/user/services/produtor.service';

import {
  ProdutorRequest
} from '../../core/user/models/produtor-request';


@Component({
  selector: 'app-onboarding-produtor',

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatIconModule
  ],

  templateUrl: './onboarding-produtor.html',
  styleUrl: './onboarding-produtor.scss'
})
export class OnboardingProdutor {

  private readonly formBuilder =
    inject(FormBuilder);

  private readonly produtorService =
    inject(ProdutorService);

  private readonly router =
    inject(Router);


  loading = signal(false);

  errorMessage = signal('');


  readonly maxBirthDate =
    new Date()
      .toISOString()
      .split('T')[0];


  produtorForm =
    this.formBuilder.nonNullable.group({

      nomeCompleto: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(150)
        ]
      ],

      cpfOrCnpj: [
        '',
        [
          Validators.required
        ]
      ],

      dataNascimento: [
        '',
        [
          Validators.required
        ]
      ],

      telefone: [
        '',
        [
          Validators.required
        ]
      ]

    });


  onSubmit(): void {

    this.errorMessage.set('');


    if (this.produtorForm.invalid) {

      this.produtorForm.markAllAsTouched();

      return;
    }


    this.loading.set(true);


    const form =
      this.produtorForm.getRawValue();


    const request: ProdutorRequest = {

      nomeCompleto:
        form.nomeCompleto.trim(),

      cpfOrCnpj:
        this.removeMask(
          form.cpfOrCnpj
        ),

      dataNascimento:
        form.dataNascimento,

      telefone:
        this.removeMask(
          form.telefone
        )

    };


    this.produtorService
      .cadastrar(request)

      .pipe(

        finalize(() => {

          this.loading.set(false);

        })

      )

      .subscribe({

        next: () => {

          /*
           * Voltamos para o onboarding.
           *
           * Ao carregar novamente,
           * /api/me/context já deverá
           * retornar:
           *
           * possuiPerfilProdutor = true
           */
          this.router.navigate([
            '/onboarding'
          ]);

        },


        error: error => {

          console.error(
            'Erro ao cadastrar produtor:',
            error
          );


          const backendMessage =
            error?.error?.message;


          if (backendMessage) {

            this.errorMessage.set(
              backendMessage
            );

            return;
          }


          if (error.status === 400) {

            this.errorMessage.set(
              'Verifique os dados informados.'
            );

          } else if (error.status === 401) {

            this.errorMessage.set(
              'Sua sessão não é válida. Entre novamente.'
            );

          } else if (error.status === 403) {

            this.errorMessage.set(
              'Você não possui permissão para realizar esta operação.'
            );

          } else if (error.status === 409) {

            this.errorMessage.set(
              'Este usuário já possui um perfil de produtor.'
            );

          } else if (error.status === 0) {

            this.errorMessage.set(
              'Não foi possível conectar ao servidor.'
            );

          } else {

            this.errorMessage.set(
              'Não foi possível cadastrar o perfil de produtor.'
            );

          }

        }

      });

  }


  formatCpfCnpj(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    let value =
      input.value.replace(/\D/g, '');


    if (value.length <= 11) {

      value =
        value.substring(0, 11);

      value =
        value.replace(
          /(\d{3})(\d)/,
          '$1.$2'
        );

      value =
        value.replace(
          /(\d{3})(\d)/,
          '$1.$2'
        );

      value =
        value.replace(
          /(\d{3})(\d{1,2})$/,
          '$1-$2'
        );

    } else {

      value =
        value.substring(0, 14);

      value =
        value.replace(
          /^(\d{2})(\d)/,
          '$1.$2'
        );

      value =
        value.replace(
          /^(\d{2})\.(\d{3})(\d)/,
          '$1.$2.$3'
        );

      value =
        value.replace(
          /\.(\d{3})(\d)/,
          '.$1/$2'
        );

      value =
        value.replace(
          /(\d{4})(\d)/,
          '$1-$2'
        );

    }


    input.value = value;


    this.produtorForm
      .controls
      .cpfOrCnpj
      .setValue(
        value,
        {
          emitEvent: false
        }
      );

  }


  formatTelefone(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    let value =
      input.value.replace(/\D/g, '');


    value =
      value.substring(0, 11);


    if (value.length <= 10) {

      value =
        value.replace(
          /^(\d{2})(\d)/,
          '($1) $2'
        );

      value =
        value.replace(
          /(\d{4})(\d)/,
          '$1-$2'
        );

    } else {

      value =
        value.replace(
          /^(\d{2})(\d)/,
          '($1) $2'
        );

      value =
        value.replace(
          /(\d{5})(\d)/,
          '$1-$2'
        );

    }


    input.value = value;


    this.produtorForm
      .controls
      .telefone
      .setValue(
        value,
        {
          emitEvent: false
        }
      );

  }


  private removeMask(
    value: string
  ): string {

    return value.replace(
      /\D/g,
      ''
    );

  }


  voltar(): void {

    this.router.navigate([
      '/onboarding'
    ]);

  }

}