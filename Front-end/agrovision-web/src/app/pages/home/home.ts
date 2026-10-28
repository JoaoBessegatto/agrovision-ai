import {
  Component,
  inject
} from '@angular/core';

import {
  RouterLink
} from '@angular/router';

import {
  MatIconModule
} from '@angular/material/icon';

import {
  AuthService
} from '../../core/auth/services/auth.service';

import {
  FazendaContextService
} from '../../core/fazenda/services/fazenda-context.service';

@Component({
  selector: 'app-home',

  standalone: true,

  imports: [
    RouterLink,
    MatIconModule
  ],

  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {

  private readonly authService =
    inject(AuthService);

  readonly fazendaContext =
    inject(FazendaContextService);

  readonly nomeUsuario: string =
    this.authService.getUser()?.username ?? '';

  readonly saudacao =
    this.obterSaudacao();

  readonly dataHoje =
    new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(new Date());


  private obterSaudacao(): string {

    const hora = new Date().getHours();

    if (hora < 12) return 'Bom dia';
    if (hora < 18) return 'Boa tarde';

    return 'Boa noite';

  }

}