export type TipoAreaManejoRebanho =
  | 'PASTO'
  | 'CONFINAMENTO';

export interface RebanhoResponse {
  id: string;
  nome: string;
  descricao: string | null;
  fazendaId: string;
  quantidadeAnimais: number;
  areaManejoId: string | null;
  areaManejoNome: string | null;
  areaManejoTipo: TipoAreaManejoRebanho | null;
}
