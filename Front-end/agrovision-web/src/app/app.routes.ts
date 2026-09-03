import { Routes } from '@angular/router';

import { authGuard } from './core/auth/guards/auth.guard';

export const routes: Routes = [

  {
  path: 'login',
  loadComponent: () =>
    import('./pages/login/login.component')
      .then(m => m.Login)
},
{
  path: 'dashboard',
  canActivate: [authGuard],
  loadComponent: () =>
    import('./pages/dashboard/dashboard.component')
      .then(m => m.Dashboard)
},

  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  {
    path: '**',
    redirectTo: 'dashboard'
  }
];