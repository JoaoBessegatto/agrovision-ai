
import { Routes } from '@angular/router';

import { authGuard } from './core/auth/guards/auth.guard';

export const routes: Routes = [

  {
    path: '',
    loadComponent: () =>
      import('./pages/landing/landing')
        .then(m => m.Landing)
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component')
        .then(m => m.LoginComponent)
  },

  {
    path: 'cadastro',
    loadComponent: () =>
      import('./pages/cadastro/cadastro')
        .then(m => m.Cadastro)
  },

  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component')
        .then(m => m.Dashboard)
  },

  {
    path: '**',
    redirectTo: ''
  }

];
