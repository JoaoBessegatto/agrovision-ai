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
  AreaManejo,
  AreaManejoRequest,
  ResumoAreasManejo
} from '../models/area-manejo';

@Injectable({
  providedIn: 'root'
})
export class AreaManejoService {

  private readonly http =
    inject(HttpClient);

  private readonly API_URL =
    `${API_BASE_URL}/areas-manejo`;


  listarResumo(
    fazendaId: string
  ): Observable<ResumoAreasManejo> {

    return this.http
      .get<ResumoAreasManejo>(
        `${this.API_URL}/fazenda/${fazendaId}`
      );
  }


  buscarPorId(
    areaId: string
  ): Observable<AreaManejo> {

    return this.http
      .get<AreaManejo>(
        `${this.API_URL}/${areaId}`
      );
  }


  cadastrar(
    fazendaId: string,
    request: AreaManejoRequest
  ): Observable<AreaManejo> {

    return this.http
      .post<AreaManejo>(
        `${this.API_URL}/fazenda/${fazendaId}`,
        request
      );
  }


  atualizar(
    areaId: string,
    request: AreaManejoRequest
  ): Observable<AreaManejo> {

    return this.http
      .put<AreaManejo>(
        `${this.API_URL}/${areaId}`,
        request
      );
  }


  associarRebanho(
    areaId: string,
    rebanhoId: string | null
  ): Observable<AreaManejo> {

    return this.http
      .patch<AreaManejo>(
        `${this.API_URL}/${areaId}/rebanho`,
        {
          rebanhoId
        }
      );
  }


  deletar(
    areaId: string
  ): Observable<void> {

    return this.http
      .delete<void>(
        `${this.API_URL}/${areaId}`
      );
  }
}
