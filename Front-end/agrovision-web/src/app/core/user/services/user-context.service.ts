import { API_BASE_URL } from '../../config/api.config';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  UsuarioContext
} from '../models/user-context';

@Injectable({
  providedIn: 'root'
})
export class UsuarioContextService {

  private readonly http =
    inject(HttpClient);

  private readonly API_URL =
    `${API_BASE_URL}/me`;

  getContexto():
    Observable<UsuarioContext> {

    return this.http.get<UsuarioContext>(
      `${this.API_URL}/context`
    );
  }
}