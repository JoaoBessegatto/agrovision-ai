import { API_BASE_URL } from '../../config/api.config';
import {
  inject,
  Injectable
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';

import {
  FazendaGeopoligonoRequest,
  FazendaGeopoligonoResponse
} from '../models/fazenda-geopoligono';

@Injectable({
  providedIn: 'root'
})
export class FazendaGeopoligonoService {

  private readonly http =
    inject(HttpClient);

  private readonly API_URL =
    `${API_BASE_URL}/fazenda`;


  buscar(
    fazendaId: string
  ): Observable<FazendaGeopoligonoResponse> {

    return this.http
      .get<FazendaGeopoligonoResponse>(
        `${this.API_URL}/${fazendaId}/geopoligono`
      );
  }


  salvar(
    fazendaId: string,
    request: FazendaGeopoligonoRequest
  ): Observable<FazendaGeopoligonoResponse> {

    return this.http
      .put<FazendaGeopoligonoResponse>(
        `${this.API_URL}/${fazendaId}/geopoligono`,
        request
      );
  }


  remover(
    fazendaId: string
  ): Observable<void> {

    return this.http
      .delete<void>(
        `${this.API_URL}/${fazendaId}/geopoligono`
      );
  }
}
