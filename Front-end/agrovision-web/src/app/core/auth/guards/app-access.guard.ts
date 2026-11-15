import {
  inject
} from '@angular/core';

import {
  CanActivateFn,
  Router
} from '@angular/router';

import {
  catchError,
  map,
  of
} from 'rxjs';

import {
  UsuarioContextService
} from '../../user/services/user-context.service';

export const appAccessGuard: CanActivateFn =
  () => {

    const usuarioContextService =
      inject(UsuarioContextService);

    const router =
      inject(Router);


    return usuarioContextService
      .getContexto()

      .pipe(

        map(contexto => {

          if (
            contexto.admin ||
            contexto.possuiAcessoFazenda
          ) {
            return true;
          }


          if (
            contexto.possuiVinculoFuncionario
          ) {

            return router.parseUrl(
              '/acesso-suspenso'
            );
          }


          return router.parseUrl(
            '/onboarding'
          );
        }),

        catchError(() =>
          of(
            router.parseUrl(
              '/login'
            )
          )
        )

      );
  };
