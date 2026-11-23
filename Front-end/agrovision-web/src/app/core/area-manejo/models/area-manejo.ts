import {
  GeoJsonPolygon
} from '../../fazenda/models/fazenda-geopoligono';

export type TipoAreaManejo =
  | 'PASTO'
  | 'CONFINAMENTO';

export type StatusCapacidadeConfinamento =
  | 'VAZIO'
  | 'DISPONIVEL'
  | 'LOTADO'
  | 'ACIMA_CAPACIDADE'
  | 'SEM_CAPACIDADE_INFORMADA';

export interface IndicadoresAreaManejo {
  animaisAtivos: number;
  pesoVivoTotalKg: number | null;
  pesoMedioKg: number | null;
  unidadesAnimais: number | null;
  cabecasPorHa: number | null;
  uaPorHa: number | null;
  pesoVivoPorHaKg: number | null;
  metrosQuadradosPorCabeca: number | null;
  capacidadeMaximaCabecas: number | null;
  ocupacaoPercentual: number | null;
  vagasDisponiveis: number | null;
  excedenteCabecas: number | null;
  statusConfinamento: StatusCapacidadeConfinamento | null;
}

export interface AreaManejo {
  id: string;
  fazendaId: string;
  nome: string;
  descricao: string | null;
  tipo: TipoAreaManejo;
  geometry: GeoJsonPolygon;
  areaCalculadaHa: number;
  rebanhoId: string | null;
  rebanhoNome: string | null;
  indicadores: IndicadoresAreaManejo;
  criadoEm: string;
  atualizadoEm: string;
}

export interface AreaManejoRequest {
  nome: string;
  descricao: string | null;
  tipo: TipoAreaManejo;
  geometry: GeoJsonPolygon;
  capacidadeMaximaCabecas: number | null;
  rebanhoId: string | null;
}

export interface ResumoAreasManejo {
  fazendaId: string;
  areaFazendaDelimitadaHa: number;
  areaMapeadaHa: number;
  areaLivreHa: number;
  percentualAreaMapeada: number;
  totalAreas: number;
  totalPastos: number;
  totalConfinamentos: number;
  areaPastoHa: number;
  areaConfinamentoHa: number;
  rebanhosAssociados: number;
  rebanhosSemArea: number;
  animaisAtivosEmAreas: number;
  areas: AreaManejo[];
}
