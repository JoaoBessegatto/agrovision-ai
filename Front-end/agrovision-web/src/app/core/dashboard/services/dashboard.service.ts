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
  DashboardResponse
} from '../models/dashboard-response';


@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private readonly http =
    inject(HttpClient);


  private readonly API_URL =
    `${API_BASE_URL}/dashboard`;

  buscarPorFazenda(
    fazendaId: string
  ): Observable<DashboardResponse> {

    return this.http.get<DashboardResponse>(
      `${this.API_URL}/fazenda/${fazendaId}`
    );

  }

}