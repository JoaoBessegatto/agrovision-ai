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
  DesempenhoAnimal,
  DesempenhoFazenda,
  DesempenhoRebanho
} from '../models/desempenho';

@Injectable({
  providedIn: 'root'
})
export class DesempenhoService {

  private readonly http =
    inject(HttpClient);

  private readonly API_URL =
    `${API_BASE_URL}/desempenho`;

  buscarPorFazenda(
    fazendaId: string
  ): Observable<DesempenhoFazenda> {

    return this.http.get<DesempenhoFazenda>(
      `${this.API_URL}/fazenda/${fazendaId}`
    );
  }

  buscarPorRebanho(
    rebanhoId: string
  ): Observable<DesempenhoRebanho> {

    return this.http.get<DesempenhoRebanho>(
      `${this.API_URL}/rebanho/${rebanhoId}`
    );
  }

  buscarPorAnimal(
    animalId: string
  ): Observable<DesempenhoAnimal> {

    return this.http.get<DesempenhoAnimal>(
      `${this.API_URL}/animal/${animalId}`
    );
  }
}
