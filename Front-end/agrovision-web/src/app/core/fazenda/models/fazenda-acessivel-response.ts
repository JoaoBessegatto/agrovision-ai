import { FazendaResponse } from './fazenda-response';

export type TipoAcessoFazenda =
  | 'PROPRIETARIO'
  | 'FUNCIONARIO'
  | 'ADMIN';

export type PermissaoFuncionario =
  | 'VISUALIZAR_FAZENDA'
  | 'REGISTRAR_PESO'
  | 'CADASTRAR_ANIMAL'
  | 'TRANSFERIR_ANIMAL'
  | 'ALTERAR_SITUACAO_ANIMAL'
  | 'REGISTRAR_MORTE'
  | 'GERENCIAR_REBANHO';

export interface FazendaAcessivelResponse
  extends FazendaResponse {

  tipoAcesso: TipoAcessoFazenda;

  cargo: string | null;

  permissoes: PermissaoFuncionario[];
}
