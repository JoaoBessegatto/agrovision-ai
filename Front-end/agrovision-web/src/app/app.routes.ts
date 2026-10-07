import { Routes } from '@angular/router';

import {
  authGuard
} from './core/auth/guards/auth.guard';

export const routes: Routes = [

  // =====================================
  // LANDING
  // =====================================

  {
    path: '',

    loadComponent: () =>
      import('./pages/landing/landing')
        .then(m => m.Landing)
  },


  // =====================================
  // LOGIN
  // =====================================

  {
    path: 'login',

    loadComponent: () =>
      import('./pages/login/login.component')
        .then(m => m.LoginComponent)
  },


  // =====================================
  // CADASTRO
  // =====================================

  {
    path: 'cadastro',

    loadComponent: () =>
      import('./pages/cadastro/cadastro')
        .then(m => m.CadastroComponent)
  },


  // =====================================
  // ONBOARDING
  // =====================================

  {
    path: 'onboarding',

    canActivate: [
      authGuard
    ],

    loadComponent: () =>
      import('./pages/onboarding/onboarding')
        .then(m => m.Onboarding)
  },


  {
    path: 'onboarding/produtor',

    canActivate: [
      authGuard
    ],

    loadComponent: () =>
      import(
        './pages/onboarding-produtor/onboarding-produtor'
      )
        .then(
          m => m.OnboardingProdutor
        )
  },


  {
    path: 'onboarding/fazenda',

    canActivate: [
      authGuard
    ],

    loadComponent: () =>
      import(
        './pages/onboarding-fazenda/onboarding-fazenda'
      )
        .then(
          m => m.OnboardingFazenda
        )
  },


  // =====================================
  // SISTEMA
  // =====================================

  {
    path: 'app',

    canActivate: [
      authGuard
    ],

    loadComponent: () =>
      import(
        './layouts/main-layout/main-layout'
      )
        .then(
          m => m.MainLayout
        ),

    children: [

      // INÍCIO
      {
        path: '',

        loadComponent: () =>
          import('./pages/home/home')
            .then(m => m.Home)
      },


      // DASHBOARD
      {
        path: 'dashboard',

        loadComponent: () =>
          import(
            './pages/dashboard/dashboard.component'
          )
            .then(
              m => m.Dashboard
            )
      },
      {
        path: 'rebanhos',

         loadComponent: () =>
          import('./pages/rebanhos/rebanhos')
          .then(m => m.Rebanhos)
      },
      {
        path: 'animais',

          loadComponent: () =>
            import('./pages/animais/animais')
            .then(m => m.Animais)
      },
    ]
  },


  // =====================================
  // FALLBACK
  // =====================================

  {
    path: '**',

    redirectTo: ''
  }

];