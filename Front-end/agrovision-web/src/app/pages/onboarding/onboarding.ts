import {
  Component,
  computed,
  inject,
  OnInit,
  signal
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

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
  UsuarioContextService
} from '../../core/user/services/user-context.service';

import {
  UsuarioContext
} from '../../core/user/models/user-context';


type EstadoEtapa =
  'concluida' | 'atual' | 'pendente';

interface EtapaOnboarding {
  chave: string;
  titulo: string;
  descricao: string;
  icone: string;
  estado: EstadoEtapa;
  detalhe?: string;
}


@Component({
  selector: 'app-onboarding',

  standalone: true,

  imports: [
    CommonModule,
    RouterLink,
    MatIconModule
  ],

  templateUrl: './onboarding.html',
  styleUrl: './onboarding.scss'
})
export class Onboarding implements OnInit {

  private readonly authService =
    inject(AuthService);

  private readonly contextService =
    inject(UsuarioContextService);

  private readonly router =
    inject(Router);


  contexto =
    signal<UsuarioContext | null>(null);

  loading =
    signal(true);

  errorMessage =
    signal('');


  /** As 3 etapas, já com o estado de cada uma. */
  readonly etapas =
    computed<EtapaOnboarding[]>(() => {

      const contexto = this.contexto();

      if (!contexto) {
        return [];
      }

      const feitas = [
        true,
        contexto.possuiPerfilProdutor,
        contexto.possuiFazenda
      ];

      const base = [
        {
          chave: 'conta',
          titulo: 'Conta criada',
          descricao:
            'Seu acesso ao AgroVision AI está pronto.',
          icone: 'person',
          detalhe: contexto.email
        },
        {
          chave: 'produtor',
          titulo: 'Perfil de produtor',
          descricao:
            'Informe seus dados para identificar o responsável pelas propriedades.',
          icone: 'badge'
        },
        {
          chave: 'fazenda',
          titulo: 'Primeira propriedade',
          descricao:
            'Cadastre sua fazenda para começar a gerenciar o rebanho.',
          icone: 'agriculture'
        }
      ];

      let atualMarcada = false;

      return base.map((etapa, i) => {

        let estado: EstadoEtapa;

        if (feitas[i]) {

          estado = 'concluida';

        } else if (!atualMarcada) {

          estado = 'atual';

          atualMarcada = true;

        } else {

          estado = 'pendente';

        }

        return { ...etapa, estado };

      });

    });


  readonly concluidas =
    computed(() =>
      this.etapas().filter(
        etapa => etapa.estado === 'concluida'
      ).length
    );

  readonly pendentes =
    computed(() =>
      this.etapas().length - this.concluidas()
    );

  readonly progresso =
    computed(() =>
      this.etapas().length
        ? Math.round(
            (this.concluidas() /
              this.etapas().length) * 100
          )
        : 0
    );


  ngOnInit(): void {

    this.carregarContexto();

  }


  carregarContexto(): void {

    this.loading.set(true);

    this.errorMessage.set('');


    this.contextService
      .getContexto()

      .pipe(
        finalize(() => {
          this.loading.set(false);
        })
      )

      .subscribe({

        next: contexto => {

          this.contexto.set(contexto);

        },


        error: error => {

          console.error(
            'Erro ao carregar contexto:',
            error
          );

          this.errorMessage.set(
            'Não foi possível carregar as informações da sua conta.'
          );

        }

      });
  }


  irParaProximoPasso(): void {

    const contexto =
      this.contexto();

    if (!contexto) {
      return;
    }


    if (!contexto.possuiPerfilProdutor) {

      this.router.navigate([
        '/onboarding/produtor'
      ]);

      return;
    }


    if (!contexto.possuiFazenda) {

      this.router.navigate([
        '/onboarding/fazenda'
      ]);

      return;
    }


    this.router.navigate([
      '/app'
    ]);
  }


  get tituloProximoPasso(): string {

    const contexto =
      this.contexto();

    if (!contexto) {
      return '';
    }


    if (!contexto.possuiPerfilProdutor) {

      return 'Criar perfil de produtor';

    }


    if (!contexto.possuiFazenda) {

      return 'Cadastrar minha primeira fazenda';

    }


    return 'Acessar o painel';
  }


  rotulo(estado: EstadoEtapa): string {

    switch (estado) {

      case 'concluida':
        return 'Concluída';

      case 'atual':
        return 'Próxima etapa';

      default:
        return 'Pendente';

    }

  }


  sair(): void {

    this.authService.logout();

    this.router.navigate([
      '/login'
    ]);

  }

}