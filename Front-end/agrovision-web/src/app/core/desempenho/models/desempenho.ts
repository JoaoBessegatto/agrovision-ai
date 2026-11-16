export type TendenciaDesempenho =
  | 'GANHO'
  | 'ESTAVEL'
  | 'PERDA'
  | 'SEM_DADOS';

export type SeveridadeAlertaDesempenho =
  | 'INFO'
  | 'ATENCAO'
  | 'CRITICO';

export type TipoAlertaDesempenho =
  | 'DADOS_INSUFICIENTES'
  | 'SEM_PESAGEM_RECENTE'
  | 'GMD_BAIXO'
  | 'PERDA_PESO';

export interface AlertaDesempenho {
  tipo: TipoAlertaDesempenho;
  severidade: SeveridadeAlertaDesempenho;
  titulo: string;
  mensagem: string;
  animalId: string;
  identificacaoAnimal: string;
  rebanhoId: string;
  rebanhoNome: string;
}

export interface DesempenhoAnimal {
  animalId: string;
  identificacao: string;
  rebanhoId: string;
  rebanhoNome: string;
  pesoAtualKg: number | null;
  pesoAnteriorKg: number | null;
  dataPesoAtual: string | null;
  dataPesoAnterior: string | null;
  ganhoPesoKg: number | null;
  intervaloDias: number | null;
  gmdKgDia: number | null;
  tendencia: TendenciaDesempenho;
  projecaoPesoKg: number | null;
  projecaoDias: number;
  diasSemPesagem: number | null;
  dadosSuficientes: boolean;
  alertas: AlertaDesempenho[];
}

export interface DesempenhoRebanho {
  rebanhoId: string;
  nome: string;
  animaisAtivos: number;
  animaisComGmd: number;
  coberturaGmdPercentual: number;
  pesoMedioAtualKg: number | null;
  gmdMedioKgDia: number | null;
  melhorGmdKgDia: number | null;
  piorGmdKgDia: number | null;
  animaisEmPerda: number;
  animaisComGmdBaixo: number;
  animaisSemPesagemRecente: number;
}

export interface DesempenhoFazenda {
  fazendaId: string;
  animaisAtivos: number;
  animaisComGmd: number;
  animaisSemDados: number;
  animaisEmGanho: number;
  animaisEstaveis: number;
  animaisEmPerda: number;
  gmdMedioKgDia: number | null;
  coberturaGmdPercentual: number;
  totalAlertas: number;
  alertasCriticos: number;
  gmdMinimoAlertaKgDia: number;
  diasSemPesagemAlerta: number;
  projecaoDias: number;
  calculadoEm: string;
  rebanhos: DesempenhoRebanho[];
  rankingMelhores: DesempenhoAnimal[];
  rankingAtencao: DesempenhoAnimal[];
  alertas: AlertaDesempenho[];
}
