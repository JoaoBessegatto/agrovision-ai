import { TipoExploracao } from './tipo-exploracao';

export interface FazendaRequest {

  id: string | null;

  nome: string;

  cidade: string;

  estado: string;

  latitude: number | null;

  longitude: number | null;

  areaTotalHa: number;

  exploracao: TipoExploracao;

  geopoligono: string | null;
}