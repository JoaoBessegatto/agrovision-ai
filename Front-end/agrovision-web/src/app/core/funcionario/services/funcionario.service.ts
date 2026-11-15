import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  CargoFuncionario,
  FuncionarioResponse
} from '../models/funcionario-response';

import {
  CadastroFuncionarioPorConviteRequest,
  ConviteFuncionarioPublicoResponse,
  ConviteFuncionarioRequest,
  ConviteFuncionarioResponse
} from '../models/convite-funcionario';

@Injectable({
  providedIn: 'root'
})
export class FuncionarioService {

  private readonly http =
    inject(HttpClient);

  private readonly API_URL =
    'http://localhost:8080/api/funcionarios';

  private readonly CONVITE_PUBLICO_URL =
    'http://localhost:8080/api/convites/funcionarios';


  listarPorFazenda(
    fazendaId: string
  ): Observable<FuncionarioResponse[]> {

    return this.http.get<FuncionarioResponse[]>(
      `${this.API_URL}/fazenda/${fazendaId}`
    );
  }


  buscarPorId(
    funcionarioId: string
  ): Observable<FuncionarioResponse> {

    return this.http.get<FuncionarioResponse>(
      `${this.API_URL}/${funcionarioId}`
    );
  }


  alterarCargo(
    funcionarioId: string,
    cargo: CargoFuncionario
  ): Observable<FuncionarioResponse> {

    return this.http.patch<FuncionarioResponse>(
      `${this.API_URL}/${funcionarioId}/cargo`,
      { cargo }
    );
  }


  ativar(
    funcionarioId: string
  ): Observable<void> {

    return this.http.patch<void>(
      `${this.API_URL}/${funcionarioId}/ativar`,
      {}
    );
  }


  desativar(
    funcionarioId: string
  ): Observable<void> {

    return this.http.patch<void>(
      `${this.API_URL}/${funcionarioId}/desativar`,
      {}
    );
  }


  convidar(
    request: ConviteFuncionarioRequest
  ): Observable<ConviteFuncionarioResponse> {

    return this.http.post<ConviteFuncionarioResponse>(
      `${this.API_URL}/convites`,
      request
    );
  }


  listarConvites(
    fazendaId: string
  ): Observable<ConviteFuncionarioResponse[]> {

    return this.http.get<ConviteFuncionarioResponse[]>(
      `${this.API_URL}/convites/fazenda/${fazendaId}`
    );
  }


  reenviarConvite(
    conviteId: string
  ): Observable<ConviteFuncionarioResponse> {

    return this.http.post<ConviteFuncionarioResponse>(
      `${this.API_URL}/convites/${conviteId}/reenviar`,
      {}
    );
  }


  cancelarConvite(
    conviteId: string
  ): Observable<void> {

    return this.http.patch<void>(
      `${this.API_URL}/convites/${conviteId}/cancelar`,
      {}
    );
  }


  consultarConvite(
    token: string
  ): Observable<ConviteFuncionarioPublicoResponse> {

    return this.http.get<ConviteFuncionarioPublicoResponse>(
      `${this.CONVITE_PUBLICO_URL}/${encodeURIComponent(token)}`
    );
  }


  cadastrarPorConvite(
    request: CadastroFuncionarioPorConviteRequest
  ): Observable<void> {

    return this.http.post<void>(
      `${this.CONVITE_PUBLICO_URL}/cadastrar`,
      request
    );
  }


  aceitarConvite(
    token: string
  ): Observable<void> {

    return this.http.post<void>(
      `${this.CONVITE_PUBLICO_URL}/${encodeURIComponent(token)}/aceitar`,
      {}
    );
  }
}
