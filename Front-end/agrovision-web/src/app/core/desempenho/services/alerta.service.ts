import { API_BASE_URL } from '../../config/api.config';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AlertaDesempenho } from '../models/desempenho';

export interface CentralAlertas {
  fazendaId: string;
  animaisAtivos: number;
  calculadoEm: string;
  gmdMinimoAlertaKgDia: number;
  diasSemPesagemAlerta: number;
  alertas: AlertaDesempenho[];
}

@Injectable({ providedIn: 'root' })
export class AlertaService {
  private readonly http = inject(HttpClient);

  listar(fazendaId: string) {
    return this.http.get<CentralAlertas>(`${API_BASE_URL}/alertas/fazenda/${fazendaId}`);
  }
}
