import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners
} from '@angular/core';

import {
  registerLocaleData
} from '@angular/common';

import localePt from '@angular/common/locales/pt';

import {
  provideRouter
} from '@angular/router';

import {
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';

import {
  provideEchartsCore
} from 'ngx-echarts';

import {
  jwtInterceptor
} from './core/auth/interceptors/jwt.interceptor';

import {
  echarts
} from './core/config/echarts.config';

import {
  routes
} from './app.routes';


registerLocaleData(
  localePt,
  'pt-BR'
);


export const appConfig: ApplicationConfig = {

  providers: [

    provideBrowserGlobalErrorListeners(),

    {
      provide: LOCALE_ID,
      useValue: 'pt-BR'
    },

    provideRouter(
      routes
    ),

    provideHttpClient(
      withInterceptors([
        jwtInterceptor
      ])
    ),

    provideEchartsCore({
      echarts
    })

  ]

};