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
  FazendaService
} from '../../core/fazenda/services/fazenda.service';

import {
  FazendaRequest
} from '../../core/fazenda/models/fazenda-request';

import {
  TipoExploracao
} from '../../core/fazenda/models/tipo-exploracao';

import {
  UsuarioContextService
} from '../../core/user/services/user-context.service';


function positiveNumberValidator(): ValidatorFn {

  return (
    control: AbstractControl
  ): ValidationErrors | null => {

    if (
      control.value === null ||
      control.value === undefined ||
      control.value === ''
    ) {
      return null;
    }

    const value =
      Number(
        String(control.value)
          .replace(',', '.')
      );

    if (
      Number.isNaN(value) ||
      value <= 0
    ) {

      return {
        positiveNumber: true
      };
    }

    return null;
  };
}


function optionalNumberRangeValidator(
  min: number,
  max: number
): ValidatorFn {

  return (
    control: AbstractControl
  ): ValidationErrors | null => {

    if (
      control.value === null ||
      control.value === undefined ||
      control.value === ''
    ) {

      return null;
    }

    const value =
      Number(
        String(control.value)
          .replace(',', '.')
      );


    if (
      Number.isNaN(value) ||
      value < min ||
      value > max
    ) {

      return {
        numberRange: {
          min,
          max
        }
      };
    }

    return null;
  };
}


@Component({
  selector: 'app-onboarding-fazenda',

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatIconModule
  ],

  templateUrl: './onboarding-fazenda.html',
  styleUrl: './onboarding-fazenda.scss'
})
export class OnboardingFazenda
  implements OnInit {

  private readonly formBuilder =
    inject(FormBuilder);

  private readonly fazendaService =
    inject(FazendaService);

  private readonly contextService =
    inject(UsuarioContextService);

  private readonly router =
    inject(Router);


  loading = signal(false);

  pageLoading = signal(true);

  errorMessage = signal('');


  readonly estados = [
    'AC',
    'AL',
    'AP',
    'AM',
    'BA',
    'CE',
    'DF',
    'ES',
    'GO',
    'MA',
    'MT',
    'MS',
    'MG',
    'PA',
    'PB',
    'PR',
    'PE',
    'PI',
    'RJ',
    'RN',
    'RS',
    'RO',
    'RR',
    'SC',
    'SP',
    'SE',
    'TO'
  ];


  readonly tiposExploracao: {
    value: TipoExploracao;
    label: string;
    description: string;
  }[] = [

    {
      value: 'CRIA',
      label: 'Cria',
      description:
        'Produção focada na reprodução e criação dos animais.'
    },

    {
      value: 'RECRIA',
      label: 'Recria',
      description:
        'Desenvolvimento dos animais após a fase de cria.'
    },

    {
      value: 'ENGORDA',
      label: 'Engorda',
      description:
        'Fase destinada ao ganho de peso e terminação.'
    },

    {
      value: 'CICLO_COMPLETO',
      label: 'Ciclo completo',
      description:
        'Cria, recria e engorda dentro da mesma propriedade.'
    }

  ];


  fazendaForm =
    this.formBuilder.nonNullable.group({

      nome: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(150)
        ]
      ],

      cidade: [
        '',
        [
          Validators.required,
          Validators.minLength(2)
        ]
      ],

      estado: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(2)
        ]
      ],

      areaTotalHa: [
        '',
        [
          Validators.required,
          positiveNumberValidator()
        ]
      ],

      exploracao: [
        '',
        [
          Validators.required
        ]
      ],

      latitude: [
        '',
        [
          optionalNumberRangeValidator(
            -90,
            90
          )
        ]
      ],

      longitude: [
        '',
        [
          optionalNumberRangeValidator(
            -180,
            180
          )
        ]
      ],

      geopoligono: [
        ''
      ]

    });


  ngOnInit(): void {

    this.validarAcesso();

  }


  private validarAcesso(): void {

    this.contextService
      .getContexto()

      .pipe(

        finalize(() => {

          this.pageLoading.set(false);

        })

      )

      .subscribe({

        next: contexto => {

          /*
           * O usuário não pode cadastrar
           * fazenda sem possuir Produtor.
           */
          if (
            !contexto.possuiPerfilProdutor
          ) {

            this.router.navigate([
              '/onboarding'
            ]);

            return;
          }


          /*
           * Esta página é especificamente
           * para a PRIMEIRA fazenda.
           *
           * Se já possui uma, vai para
           * dashboard.
           */
          if (
            contexto.possuiFazenda
          ) {

            this.router.navigate([
              '/dashboard'
            ]);

          }

        },


        error: error => {

          console.error(
            'Erro ao validar onboarding:',
            error
          );

          this.errorMessage.set(
            'Não foi possível verificar os dados da sua conta.'
          );

        }

      });

  }


  onSubmit(): void {

    this.errorMessage.set('');


    if (
      this.fazendaForm.invalid
    ) {

      this.fazendaForm
        .markAllAsTouched();

      return;
    }


    this.loading.set(true);


    const form =
      this.fazendaForm
        .getRawValue();


    const request: FazendaRequest = {

      id: null,

      nome:
        form.nome.trim(),

      cidade:
        form.cidade.trim(),

      estado:
        form.estado,

      areaTotalHa:
        this.toNumber(
          form.areaTotalHa
        )!,

      exploracao:
        form.exploracao as TipoExploracao,

      latitude:
        this.toNumber(
          form.latitude
        ),

      longitude:
        this.toNumber(
          form.longitude
        ),

      geopoligono:
        form.geopoligono.trim()
          ? form.geopoligono.trim()
          : null

    };


    this.fazendaService
      .cadastrar(request)

      .pipe(

        finalize(() => {

          this.loading.set(false);

        })

      )

      .subscribe({

        next: fazenda => {

          console.log(
            'Fazenda criada:',
            fazenda
          );

          this.router.navigate([
            '/app'
          ]);

        },


        error: error => {

          console.error(
            'Erro ao cadastrar fazenda:',
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
              'Verifique os dados da propriedade.'
            );

          } else if (
            error.status === 401
          ) {

            this.errorMessage.set(
              'Sua sessão expirou. Entre novamente.'
            );

          } else if (
            error.status === 403
          ) {

            this.errorMessage.set(
              'Você não possui permissão para cadastrar esta propriedade.'
            );

          } else if (
            error.status === 0
          ) {

            this.errorMessage.set(
              'Não foi possível conectar ao servidor.'
            );

          } else {

            this.errorMessage.set(
              'Não foi possível cadastrar a propriedade.'
            );

          }

        }

      });

  }


  private toNumber(
    value: string
  ): number | null {

    if (
      value === null ||
      value === undefined ||
      value.trim() === ''
    ) {

      return null;
    }


    const parsed =
      Number(
        value
          .trim()
          .replace(',', '.')
      );


    return Number.isNaN(parsed)
      ? null
      : parsed;
  }


  voltar(): void {

    this.router.navigate([
      '/onboarding'
    ]);

  }

}