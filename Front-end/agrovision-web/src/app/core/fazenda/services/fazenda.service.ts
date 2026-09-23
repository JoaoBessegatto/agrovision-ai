import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  FazendaRequest
} from '../models/fazenda-request';

import {
  FazendaResponse
} from '../models/fazenda-response';

@Injectable({
  providedIn: 'root'
})
export class FazendaService {

  private readonly http =
    inject(HttpClient);

  private readonly API_URL =
    'http://localhost:8080/api/fazenda';


  cadastrar(
    fazenda: FazendaRequest
  ): Observable<FazendaResponse> {

    return this.http.post<FazendaResponse>(
      this.API_URL,
      fazenda
    );
  }


  buscarPorId(
    id: string
  ): Observable<FazendaResponse> {

    return this.http.get<FazendaResponse>(
      `${this.API_URL}/${id}`
    );
  }


  atualizar(
    fazenda: FazendaRequest
  ): Observable<FazendaResponse> {

    return this.http.put<FazendaResponse>(
      this.API_URL,
      fazenda
    );
  }


  deletar(
    id: string
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.API_URL}/${id}`
    );
  }
}