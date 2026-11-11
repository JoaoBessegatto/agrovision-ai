import {
  DashboardRebanho
} from './dashboard-rebanho';

import {
  DashboardEvolucaoPeso
} from './dashboard-evolucao-peso';


export interface DashboardResponse {

  fazendaId: string;

  totalAnimais: number;

  animaisAtivos: number;

  animaisInativos: number;

  animaisVendidos: number;

  animaisMortos: number;

  totalRebanhos: number;

  totalPesagens: number;

  pesoMedioAtual: number;

  ultimaPesagem: string | null;

  rebanhos: DashboardRebanho[];

  evolucaoPeso: DashboardEvolucaoPeso[];

}