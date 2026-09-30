import {
  computed,
  inject,
  Injectable,
  signal
} from '@angular/core';

import { finalize } from 'rxjs';

import { FazendaService } from './fazenda.service';
import { FazendaResponse } from '../models/fazenda-response';

@Injectable({
  providedIn: 'root'
})
export class FazendaContextService {

  private readonly fazendaService =
    inject(FazendaService);

  private readonly STORAGE_KEY =
    'fazendaAtivaId';


  // ==========================================
  // ESTADO
  // ==========================================

  private readonly _fazendas =
    signal<FazendaResponse[]>([]);

  private readonly _fazendaAtiva =
    signal<FazendaResponse | null>(null);

  private readonly _loading =
    signal(false);

  private readonly _carregado =
    signal(false);


  // ==========================================
  // ESTADO PÚBLICO
  // ==========================================

  readonly fazendas =
    this._fazendas.asReadonly();

  readonly fazendaAtiva =
    this._fazendaAtiva.asReadonly();

  readonly loading =
    this._loading.asReadonly();

  readonly carregado =
    this._carregado.asReadonly();


  // ==========================================
  // COMPUTED
  // ==========================================

  readonly fazendaAtivaId =
    computed(() =>
      this._fazendaAtiva()?.id ?? null
    );

  readonly possuiFazendas =
    computed(() =>
      this._fazendas().length > 0
    );

  readonly possuiMultiplasFazendas =
    computed(() =>
      this._fazendas().length > 1
    );


  // ==========================================
  // CARREGAR FAZENDAS
  // ==========================================

  carregarFazendas(): void {

    /*
     * Impede requisições desnecessárias
     * se o contexto já tiver sido carregado.
     */
    if (this._carregado()) {
      return;
    }

    this._loading.set(true);

    this.fazendaService
      .listarMinhasFazendas()

      .pipe(
        finalize(() => {
          this._loading.set(false);
          this._carregado.set(true);
        })
      )

      .subscribe({

        next: fazendas => {

          this._fazendas.set(fazendas);

          this.definirFazendaInicial(fazendas);

        },

        error: error => {

          console.error(
            'Erro ao carregar fazendas:',
            error
          );

          this._fazendas.set([]);

          this._fazendaAtiva.set(null);

        }

      });

  }


  // ==========================================
  // DEFINIR FAZENDA ATIVA
  // ==========================================

  selecionarFazenda(
    fazenda: FazendaResponse
  ): void {

    this._fazendaAtiva.set(fazenda);

    localStorage.setItem(
      this.STORAGE_KEY,
      fazenda.id
    );

  }


  // ==========================================
  // SELECIONAR POR ID
  // ==========================================

  selecionarFazendaPorId(
    fazendaId: string
  ): void {

    const fazenda =
      this._fazendas()
        .find(
          item =>
            item.id === fazendaId
        );

    if (!fazenda) {

      console.warn(
        'Fazenda não encontrada no contexto:',
        fazendaId
      );

      return;
    }

    this.selecionarFazenda(fazenda);

  }


  // ==========================================
  // ATUALIZAR LISTA
  // ==========================================

  recarregarFazendas(): void {

    this._carregado.set(false);

    this.carregarFazendas();

  }


  // ==========================================
  // LIMPAR CONTEXTO
  // ==========================================

  limpar(): void {

    this._fazendas.set([]);

    this._fazendaAtiva.set(null);

    this._carregado.set(false);

    localStorage.removeItem(
      this.STORAGE_KEY
    );

  }


  // ==========================================
  // FAZENDA INICIAL
  // ==========================================

  private definirFazendaInicial(
    fazendas: FazendaResponse[]
  ): void {

    if (fazendas.length === 0) {

      this._fazendaAtiva.set(null);

      localStorage.removeItem(
        this.STORAGE_KEY
      );

      return;
    }


    /*
     * Primeiro tenta recuperar
     * a última fazenda utilizada.
     */
    const fazendaSalvaId =
      localStorage.getItem(
        this.STORAGE_KEY
      );


    if (fazendaSalvaId) {

      const fazendaSalva =
        fazendas.find(
          fazenda =>
            fazenda.id === fazendaSalvaId
        );


      if (fazendaSalva) {

        this._fazendaAtiva.set(
          fazendaSalva
        );

        return;

      }

    }


    /*
     * Se nunca selecionou uma,
     * usa a primeira da lista.
     */
    this.selecionarFazenda(
      fazendas[0]
    );

  }

}