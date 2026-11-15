export interface FuncionarioResponse {
  id: string;
  usuarioId: string;
  nomeUsuario: string;
  email: string;
  fazendaId: string;
  nomeFazenda: string;
  cargo: CargoFuncionario;
  permissoes: string[];
  ativo: boolean;
  dataVinculo: string;
}

export type CargoFuncionario =
  | 'GERENTE'
  | 'TRATADOR'
  | 'VETERINARIO';
