import { SexoAnimal } from './sexo-animal';
import { SituacaoAnimal } from './situacao-animal';

export interface AnimalResponse {

  id: string;

  identificacao: string;

  raca: string;

  sexo: SexoAnimal;

  dataNascimento: string;

  situacao: SituacaoAnimal;

  pesoAtual: number;

  rebanhoId: string;

  rebanhoNome: string;

  idadeMeses: number;
}