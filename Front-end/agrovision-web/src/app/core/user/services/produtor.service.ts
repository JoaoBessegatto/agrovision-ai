import { API_BASE_URL } from '../../config/api.config';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ProdutorRequest } from '../models/produtor-request';
import { ProdutorResponse } from '../models/produtor-response';

@Injectable({
  providedIn: 'root'
})
export class ProdutorService {

  private readonly http = inject(HttpClient);

  private readonly API_URL =
    `${API_BASE_URL}/produtor`;


  cadastrar(
    produtor: ProdutorRequest
  ): Observable<ProdutorResponse> {

    return this.http.post<ProdutorResponse>(
      this.API_URL,
      produtor
    );
  }


  buscarMeuPerfil():
    Observable<ProdutorResponse> {

    return this.http.get<ProdutorResponse>(
      `${this.API_URL}/me`
    );
  }


  atualizar(
    produtor: ProdutorRequest
  ): Observable<ProdutorResponse> {

    return this.http.put<ProdutorResponse>(
      `${this.API_URL}/me`,
      produtor
    );
  }

}