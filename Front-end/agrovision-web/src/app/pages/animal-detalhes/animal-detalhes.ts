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
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

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

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly animalService =
    inject(AnimalService);

  private readonly rebanhoService =
    inject(RebanhoService);

  readonly fazendaContext =
    inject(FazendaContextService);

  private readonly formBuilder =
    inject(FormBuilder);

  private readonly registroPesoService =
    inject(RegistroPesoService);

  // ==========================================
  // ESTADO
  // ==========================================

  animal =
    signal<AnimalResponse | null>(null);

  rebanhos =
    signal<RebanhoResponse[]>([]);

  loading =
    signal(true);

  carregandoRebanhos =
    signal(false);

  alterandoStatus =
    signal(false);

  transferindo =
    signal(false);

  errorMessage =
    signal('');

  pesagens =
    signal<RegistroPesoResponse[]>([]);


  loadingPesagens = signal(false);


  modalPesagem = signal(false);


  salvandoPesagem = signal(false);

  // ==========================================
  // TRANSFERÊNCIA
  // ==========================================

  modalTransferencia =
    signal(false);

  novoRebanhoId =
    signal('');


  private readonly animalId: string;

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

  constructor() {

    const id =
      this.route.snapshot
        .paramMap
        .get('id');


    if (!id) {

      this.router.navigate([
        '/app/animais'
      ]);

      this.animalId = '';

      return;

    }


    this.animalId = id;

    this.carregarAnimal();


    /*
     * Reage à fazenda selecionada
     * na topbar.
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


  // ==========================================
  // CARREGAR ANIMAL
  // ==========================================

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

      }

    });
}
abrirNovaPesagem(): void {

  const animal =
    this.animal();


  if (!animal) {
    return;
  }


  if (
    animal.situacao !== 'ATIVO'
  ) {

    this.errorMessage.set(
      'Somente animais ativos podem receber novas pesagens.'
    );

    return;
  }


  this.pesagemForm.reset({

    pesoKg: null

  });


  this.modalPesagem.set(
    true
  );

}
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
registrarPesagem(): void {

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


  const form =
    this.pesagemForm
      .getRawValue();


  const peso =
    Number(
      form.pesoKg
    );


  this.salvandoPesagem.set(
    true
  );

  this.errorMessage.set('');


  this.registroPesoService
    .registrar(
      animal.id,
      {
        pesoKg: peso
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

        this.modalPesagem.set(
          false
        );


        /*
         * Como o backend já retorna
         * o registro recém-criado,
         * podemos colocá-lo imediatamente
         * no topo do histórico.
         */
        this.pesagens.update(
          lista => [
            registro,
            ...lista
          ]
        );


        /*
         * Atualiza os dados do Animal,
         * principalmente pesoAtual.
         */
        this.carregarAnimal();


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
calcularVariacao(
  index: number
): number | null {

  const registros =
    this.pesagens();


  /*
   * Como a lista vem:
   *
   * mais recente
   * ↓
   * mais antiga
   *
   * precisamos comparar o registro atual
   * com o próximo da lista.
   */
  if (
    index >= registros.length - 1
  ) {

    return null;

  }


  const atual =
    registros[index];

  const anterior =
    registros[index + 1];


  return (
    atual.pesoKg -
    anterior.pesoKg
  );

}


  // ==========================================
  // REBANHOS
  // ==========================================

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


  // ==========================================
  // VOLTAR
  // ==========================================

  voltar(): void {

    this.router.navigate([
      '/app/animais'
    ]);

  }


  // ==========================================
  // STATUS
  // ==========================================

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

          this.carregarAnimal();

        },


        error: error => {

          this.errorMessage.set(
            this.extrairMensagemErro(
              error,
              'Não foi possível alterar a situação do animal.'
            )
          );

        }

      });

  }


  // ==========================================
  // TRANSFERÊNCIA
  // ==========================================

  abrirTransferencia(): void {

    const animal =
      this.animal();


    if (!animal) {
      return;
    }


    this.novoRebanhoId.set(
      animal.rebanhoId
    );


    this.modalTransferencia.set(
      true
    );

  }


  fecharTransferencia(): void {

    if (this.transferindo()) {
      return;
    }


    this.modalTransferencia.set(
      false
    );

    this.novoRebanhoId.set('');

  }


  alterarNovoRebanho(
    event: Event
  ): void {

    const select =
      event.target as HTMLSelectElement;


    this.novoRebanhoId.set(
      select.value
    );

  }


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


    if (
      rebanhoId ===
      animal.rebanhoId
    ) {

      this.fecharTransferencia();

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

          this.modalTransferencia.set(
            false
          );

          this.novoRebanhoId.set('');

          this.carregarAnimal();

        },


        error: error => {

          this.errorMessage.set(
            this.extrairMensagemErro(
              error,
              'Não foi possível transferir o animal.'
            )
          );

        }

      });

  }


  // ==========================================
  // FORMATADORES
  // ==========================================

  formatarSexo(
    sexo: string
  ): string {

    return sexo === 'MACHO'
      ? 'Macho'
      : 'Fêmea';

  }


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


  formatarIdade(
    meses: number
  ): string {

    if (meses < 12) {

      return `${meses} meses`;

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


    return `${anos} anos e ${mesesRestantes} meses`;

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