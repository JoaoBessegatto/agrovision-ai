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
    `${API_BASE_URL}/animais`;


  private readonly PESAGENS_API =
    `${API_BASE_URL}/pesagens`;


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
 
  listarHistorico(
    animalId: string
  ): Observable<RegistroPesoResponse[]> {

    return this.http
      .get<RegistroPesoResponse[]>(
        `${this.ANIMAIS_API}/${animalId}/pesagens`
      );

  }

  buscarUltima(
    animalId: string
  ): Observable<RegistroPesoResponse> {

    return this.http
      .get<RegistroPesoResponse>(
        `${this.ANIMAIS_API}/${animalId}/pesagens/ultima`
      );

  }

  listarPorFazenda(
    fazendaId: string
  ): Observable<RegistroPesoResponse[]> {

    return this.http
      .get<RegistroPesoResponse[]>(
        `${this.PESAGENS_API}/fazenda/${fazendaId}`
      );

  }

}