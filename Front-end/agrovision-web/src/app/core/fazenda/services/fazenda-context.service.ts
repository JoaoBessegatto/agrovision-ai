import {
  computed,
  inject,
  Injectable,
  signal
} from '@angular/core';

import { finalize } from 'rxjs';

import { FazendaService } from './fazenda.service';

import {
  FazendaAcessivelResponse,
  PermissaoFuncionario
} from '../models/fazenda-acessivel-response';

@Injectable({
  providedIn: 'root'
})
export class FazendaContextService {

  private readonly fazendaService =
    inject(FazendaService);

  private readonly STORAGE_KEY =
    'fazendaAtivaId';


  private readonly _fazendas =
    signal<FazendaAcessivelResponse[]>([]);

  private readonly _fazendaAtiva =
    signal<FazendaAcessivelResponse | null>(null);

  private readonly _loading =
    signal(false);

  private readonly _carregado =
    signal(false);


  readonly fazendas =
    this._fazendas.asReadonly();

  readonly fazendaAtiva =
    this._fazendaAtiva.asReadonly();

  readonly loading =
    this._loading.asReadonly();

  readonly carregado =
    this._carregado.asReadonly();


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

  readonly ehProprietario =
    computed(() => {
      const acesso =
        this._fazendaAtiva()?.tipoAcesso;

      return (
        acesso === 'PROPRIETARIO' ||
        acesso === 'ADMIN'
      );
    });

  readonly ehFuncionario =
    computed(() =>
      this._fazendaAtiva()?.tipoAcesso
        === 'FUNCIONARIO'
    );

  readonly cargoAtivo =
    computed(() =>
      this._fazendaAtiva()?.cargo ?? null
    );


  carregarFazendas(): void {

    if (this._carregado()) {
      return;
    }

    this._loading.set(true);

    this.fazendaService
      .listarFazendasAcessiveis()

      .pipe(
        finalize(() => {
          this._loading.set(false);
          this._carregado.set(true);
        })
      )

      .subscribe({

        next: fazendas => {

          this._fazendas.set(fazendas);

          this.definirFazendaInicial(
            fazendas
          );
        },

        error: error => {

          console.error(
            'Erro ao carregar fazendas acessíveis:',
            error
          );

          this._fazendas.set([]);

          this._fazendaAtiva.set(null);
        }

      });
  }


  possuiPermissao(
    permissao: PermissaoFuncionario
  ): boolean {

    const fazenda =
      this._fazendaAtiva();

    if (!fazenda) {
      return false;
    }

    if (
      fazenda.tipoAcesso === 'PROPRIETARIO' ||
      fazenda.tipoAcesso === 'ADMIN'
    ) {
      return true;
    }

    return fazenda.permissoes
      .includes(permissao);
  }


  podeGerenciarFuncionarios(): boolean {

    return this.ehProprietario();
  }


  podeVender(): boolean {

    return this.ehProprietario();
  }


  selecionarFazenda(
    fazenda: FazendaAcessivelResponse
  ): void {

    this._fazendaAtiva.set(fazenda);

    localStorage.setItem(
      this.STORAGE_KEY,
      fazenda.id
    );
  }


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
      return;
    }

    this.selecionarFazenda(fazenda);
  }


  recarregarFazendas(): void {

    this._carregado.set(false);

    this.carregarFazendas();
  }


  limpar(): void {

    this._fazendas.set([]);

    this._fazendaAtiva.set(null);

    this._carregado.set(false);

    localStorage.removeItem(
      this.STORAGE_KEY
    );
  }


  private definirFazendaInicial(
    fazendas: FazendaAcessivelResponse[]
  ): void {

    if (fazendas.length === 0) {

      this._fazendaAtiva.set(null);

      localStorage.removeItem(
        this.STORAGE_KEY
      );

      return;
    }


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


    this.selecionarFazenda(
      fazendas[0]
    );
  }
}
