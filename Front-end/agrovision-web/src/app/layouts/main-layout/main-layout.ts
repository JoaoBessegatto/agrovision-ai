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
  RouterLink,
  RouterLinkActive,
  RouterOutlet
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
  selector: 'app-main-layout',

  standalone: true,

  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule
  ],

  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout implements OnInit {

  private readonly authService =
    inject(AuthService);

  private readonly router =
    inject(Router);

  readonly fazendaContext =
    inject(FazendaContextService);


  sidebarOpen =
    signal(false);


  readonly usuario =
    this.authService.getUser();


  ngOnInit(): void {

    this.fazendaContext
      .carregarFazendas();

  }


  trocarFazenda(
    event: Event
  ): void {

    const select =
      event.target as HTMLSelectElement;

    this.fazendaContext
      .selecionarFazendaPorId(
        select.value
      );

  }


  toggleSidebar(): void {

    this.sidebarOpen.update(
      value => !value
    );

  }


  fecharSidebar(): void {

    this.sidebarOpen.set(false);

  }


  logout(): void {

    this.fazendaContext
      .limpar();

    this.authService
      .logout();

    this.router.navigate([
      '/login'
    ]);

  }

}