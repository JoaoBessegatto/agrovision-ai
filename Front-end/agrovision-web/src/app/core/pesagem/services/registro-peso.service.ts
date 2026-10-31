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


  private readonly ANIMAIS_API =
    'http://localhost:8080/api/animais';


  private readonly PESAGENS_API =
    'http://localhost:8080/api/pesagens';


  // =========================================================
  // REGISTRAR PESAGEM
  // =========================================================

  registrar(
    animalId: string,
    request: RegistroPesoRequest
  ): Observable<RegistroPesoResponse> {

    return this.http
      .post<RegistroPesoResponse>(
        `${this.ANIMAIS_API}/${animalId}/pesagens`,
        request
      );

  }


  // =========================================================
  // HISTÓRICO DE UM ANIMAL
  // =========================================================

  listarHistorico(
    animalId: string
  ): Observable<RegistroPesoResponse[]> {

    return this.http
      .get<RegistroPesoResponse[]>(
        `${this.ANIMAIS_API}/${animalId}/pesagens`
      );

  }


  // =========================================================
  // ÚLTIMA PESAGEM DE UM ANIMAL
  // =========================================================

  buscarUltima(
    animalId: string
  ): Observable<RegistroPesoResponse> {

    return this.http
      .get<RegistroPesoResponse>(
        `${this.ANIMAIS_API}/${animalId}/pesagens/ultima`
      );

  }


  // =========================================================
  // PESAGENS DE UMA FAZENDA
  // =========================================================

  listarPorFazenda(
    fazendaId: string
  ): Observable<RegistroPesoResponse[]> {

    return this.http
      .get<RegistroPesoResponse[]>(
        `${this.PESAGENS_API}/fazenda/${fazendaId}`
      );

  }

}