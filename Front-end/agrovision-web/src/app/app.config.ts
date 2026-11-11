import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners
} from '@angular/core';

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


export const appConfig: ApplicationConfig = {

  providers: [

    provideBrowserGlobalErrorListeners(),

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