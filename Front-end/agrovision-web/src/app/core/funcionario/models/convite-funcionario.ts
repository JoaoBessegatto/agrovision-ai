import {
  CargoFuncionario
} from './funcionario-response';

export interface ConviteFuncionarioRequest {
  email: string;
  fazendaId: string;
  cargo: CargoFuncionario;
}

export interface ConviteFuncionarioResponse {
  id: string;
  email: string;
  fazendaId: string;
  nomeFazenda: string;
  cargo: CargoFuncionario;
  status:
    | 'PENDENTE'
    | 'ACEITO'
    | 'EXPIRADO'
    | 'CANCELADO';
  criadoEm: string;
  expiraEm: string;
  aceitoEm: string | null;
}

export interface ConviteFuncionarioPublicoResponse {
  email: string;
  nomeFazenda: string;
  cargo: CargoFuncionario;
  expiraEm: string;
  usuarioExistente: boolean;
}

export interface CadastroFuncionarioPorConviteRequest {
  token: string;
  name: string;
  password: string;
}
