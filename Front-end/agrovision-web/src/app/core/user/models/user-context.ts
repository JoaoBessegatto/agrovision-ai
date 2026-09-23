export interface UsuarioContext {
  userId: string;
  name: string;
  email: string;

  admin: boolean;

  possuiPerfilProdutor: boolean;
  possuiFazenda: boolean;
}