import { Routes } from '@angular/router';

import {
  authGuard
} from './core/auth/guards/auth.guard';

import {
  appAccessGuard
} from './core/auth/guards/app-access.guard';

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
        .then(m => m.CadastroComponent)
  },



  {
    path: 'convite-funcionario',

    loadComponent: () =>
      import(
        './pages/convite-funcionario/convite-funcionario'
      )
        .then(
          m => m.ConviteFuncionario
        )
  },


  {
    path: 'acesso-suspenso',

    canActivate: [
      authGuard
    ],

    loadComponent: () =>
      import(
        './pages/acesso-suspenso/acesso-suspenso'
      )
        .then(
          m => m.AcessoSuspenso
        )
  },


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


  {
    path: 'onboarding/fazenda/geopoligono/:fazendaId',

    canActivate: [
      authGuard
    ],

    data: {
      onboarding: true
    },

    loadComponent: () =>
      import(
        './pages/geopoligono-fazenda/geopoligono-fazenda'
      )
        .then(
          m => m.GeopoligonoFazenda
        )
  },


  {
    path: 'app',

    canActivate: [
      authGuard,
      appAccessGuard
    ],

    loadComponent: () =>
      import(
        './layouts/main-layout/main-layout'
      )
        .then(
          m => m.MainLayout
        ),

    children: [

      {
        path: '',

        loadComponent: () =>
          import('./pages/home/home')
            .then(m => m.Home)
      },


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
        path: 'desempenho',

        loadComponent: () =>
          import(
            './pages/desempenho/desempenho'
          )
            .then(
              m => m.Desempenho
            )
      },


      {
        path: 'alertas',
        loadComponent: () => import('./pages/alertas/alertas').then(m => m.Alertas)
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


      {
        path: 'animais/:id',

        loadComponent: () =>
          import(
            './pages/animal-detalhes/animal-detalhes'
          )
            .then(
              m => m.AnimalDetalhes
            )
      },


      {
        path: 'pesagens',

        loadComponent: () =>
          import('./pages/pesagens/pesagens')
            .then(m => m.Pesagens)
      },


      {
        path: 'funcionarios',

        loadComponent: () =>
          import(
            './pages/funcionarios/funcionarios'
          )
            .then(
              m => m.Funcionarios
            )
      },


      {
        path: 'fazenda/area',

        loadComponent: () =>
          import(
            './pages/geopoligono-fazenda/geopoligono-fazenda'
          )
            .then(
              m => m.GeopoligonoFazenda
            )
      },


      {
        path: 'fazenda/piquetes',
        redirectTo: 'fazenda/area',
        pathMatch: 'full'
      }

    ]
  },


  {
    path: '**',

    redirectTo: ''
  }

];
