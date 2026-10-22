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
  RegistroPesoRequest
} from '../models/registro-peso-request';

import {
  RegistroPesoResponse
} from '../models/registro-peso-response';


@Injectable({
  providedIn: 'root'
})
export class RegistroPesoService {

  private readonly http =
    inject(HttpClient);


  private readonly API_URL =
    'http://localhost:8080/api/animais';


  registrar(
    animalId: string,
    request: RegistroPesoRequest
  ): Observable<RegistroPesoResponse> {

    return this.http.post<RegistroPesoResponse>(
      `${this.API_URL}/${animalId}/pesagens`,
      request
    );

  }


  listarHistorico(
    animalId: string
  ): Observable<RegistroPesoResponse[]> {

    return this.http.get<RegistroPesoResponse[]>(
      `${this.API_URL}/${animalId}/pesagens`
    );

  }


  buscarUltima(
    animalId: string
  ): Observable<RegistroPesoResponse> {

    return this.http.get<RegistroPesoResponse>(
      `${this.API_URL}/${animalId}/pesagens/ultima`
    );

  }

}