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
    'http://localhost:8080/api/me';

  getContexto():
    Observable<UsuarioContext> {

    return this.http.get<UsuarioContext>(
      `${this.API_URL}/context`
    );
  }
}