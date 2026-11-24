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
    return this.http.get<CentralAlertas>(`http://localhost:8080/api/alertas/fazenda/${fazendaId}`);
  }
}
