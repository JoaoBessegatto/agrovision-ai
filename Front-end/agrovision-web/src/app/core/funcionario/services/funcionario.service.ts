import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface FuncionarioResponse {
  nomeUsuario: string;
  email: string;
  fazendaId: string;
  nomeFazenda: string;
  cargo: string;
  ativo: boolean;
  dataVinculo: string;
}

@Injectable({ providedIn: 'root' })
export class FuncionarioService {
  private readonly http = inject(HttpClient);

  listarPorFazenda(fazendaId: string) {
    return this.http.get<FuncionarioResponse[]>(
      `http://localhost:8080/api/funcionarios/fazenda/${fazendaId}`
    );
  }
}
