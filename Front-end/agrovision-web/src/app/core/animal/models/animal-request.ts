import { SexoAnimal } from './sexo-animal';

export interface AnimalRequest {

  identificacao: string;

  raca: string;

  sexo: SexoAnimal;

  dataNascimento: string;

  rebanhoId: string;

  pesoAtual: number;
}