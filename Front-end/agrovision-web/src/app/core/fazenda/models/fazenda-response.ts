import { TipoExploracao } from './tipo-exploracao';

export interface FazendaResponse {

  id: string;

  nome: string;

  cidade: string;

  estado: string;

  latitude: number | null;

  longitude: number | null;

  areaTotalHa: number;

  exploracao: TipoExploracao;

  geopoligono: string | null;
}