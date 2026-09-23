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
  UsuarioContextService
} from '../../core/user/services/user-context.service';

import {
  UsuarioContext
} from '../../core/user/models/user-context';


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
      '/dashboard'
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


    return 'Acessar dashboard';
  }

}