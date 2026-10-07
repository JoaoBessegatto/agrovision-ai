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
  AnimalRequest
} from '../models/animal-request';

import {
  AnimalResponse
} from '../models/animal-response';


@Injectable({
  providedIn: 'root'
})
export class AnimalService {

  private readonly http =
    inject(HttpClient);

  private readonly API_URL =
    'http://localhost:8080/api/animais';


  cadastrar(
    request: AnimalRequest
  ): Observable<AnimalResponse> {

    return this.http.post<AnimalResponse>(
      this.API_URL,
      request
    );
  }


  listarPorFazenda(
    fazendaId: string
  ): Observable<AnimalResponse[]> {

    return this.http.get<AnimalResponse[]>(
      `${this.API_URL}/fazenda/${fazendaId}`
    );
  }


  listarPorRebanho(
    rebanhoId: string
  ): Observable<AnimalResponse[]> {

    return this.http.get<AnimalResponse[]>(
      `${this.API_URL}/rebanho/${rebanhoId}`
    );
  }


  buscarPorId(
    animalId: string
  ): Observable<AnimalResponse> {

    return this.http.get<AnimalResponse>(
      `${this.API_URL}/${animalId}`
    );
  }


  transferir(
    animalId: string,
    novoRebanhoId: string
  ): Observable<void> {

    return this.http.patch<void>(
      `${this.API_URL}/${animalId}/transferencia`,
      {
        novoRebanho: novoRebanhoId
      }
    );
  }


  inativar(
    animalId: string
  ): Observable<void> {

    return this.http.patch<void>(
      `${this.API_URL}/${animalId}/inativar`,
      {}
    );
  }


  ativar(
    animalId: string
  ): Observable<void> {

    return this.http.patch<void>(
      `${this.API_URL}/${animalId}/ativar`,
      {}
    );
  }
}