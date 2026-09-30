import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import type { RebanhoRequest } from '../models/rebanho-request';
import { RebanhoResponse } from '../models/rebanho-response';

@Injectable({
  providedIn: 'root'
})
export class RebanhoService {

  private readonly http = inject(HttpClient);

  private readonly API_URL =
    'http://localhost:8080/api/rebanhos';


  listarPorFazenda(
    fazendaId: string
  ): Observable<RebanhoResponse[]> {

    return this.http.get<RebanhoResponse[]>(
      `${this.API_URL}/fazenda/${fazendaId}`
    );
  }


  buscarPorId(
    rebanhoId: string
  ): Observable<RebanhoResponse> {

    return this.http.get<RebanhoResponse>(
      `${this.API_URL}/${rebanhoId}`
    );
  }


  cadastrar(
    request: RebanhoRequest
  ): Observable<RebanhoResponse> {

    return this.http.post<RebanhoResponse>(
      this.API_URL,
      request
    );
  }


  atualizar(
    rebanhoId: string,
    request: RebanhoRequest
  ): Observable<RebanhoResponse> {

    return this.http.put<RebanhoResponse>(
      `${this.API_URL}/${rebanhoId}`,
      request
    );
  }


  deletar(
    rebanhoId: string
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.API_URL}/${rebanhoId}`
    );
  }
}