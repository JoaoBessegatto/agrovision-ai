import {
  Component,
  inject
} from '@angular/core';

import {
  Router
} from '@angular/router';

import {
  MatIconModule
} from '@angular/material/icon';

import {
  AuthService
} from '../../core/auth/services/auth.service';

@Component({
  selector: 'app-acesso-suspenso',
  standalone: true,

  imports: [
    MatIconModule
  ],

  templateUrl: './acesso-suspenso.html',
  styleUrl: './acesso-suspenso.scss'
})
export class AcessoSuspenso {

  private readonly authService =
    inject(AuthService);

  private readonly router =
    inject(Router);


  sair(): void {

    this.authService.logout();

    this.router.navigate([
      '/login'
    ]);
  }
}
