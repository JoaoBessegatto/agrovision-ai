import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import localePt from '@angular/common/locales/pt';
import { registerLocaleData } from '@angular/common';
import { DatePipe, DecimalPipe } from '@angular/common';
import { from, mergeMap, Subscription, toArray } from 'rxjs';
import { AnimalService } from '../../core/animal/services/animal.service';
import { RebanhoService } from '../../core/rebanho/services/rebanho.service';
import { RegistroPesoService } from '../../core/pesagem/services/registro-peso.service';
import { RegistroPesoResponse } from '../../core/pesagem/models/registro-peso-response';
import { FuncionarioService } from '../../core/funcionario/services/funcionario.service';

import {
  Component,
  inject,
  effect,
  signal
} from '@angular/core';

import {
  RouterLink
} from '@angular/router';

import {
  MatIconModule
} from '@angular/material/icon';

import {
  UsuarioContextService
} from '../../core/user/services/user-context.service';

import {
  FazendaContextService
} from '../../core/fazenda/services/fazenda-context.service';

registerLocaleData(localePt);

@Component({
  selector: 'app-home',

  standalone: true,

  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    MatIconModule
  ],

  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {

  private readonly usuarioContextService =
    inject(UsuarioContextService);

  readonly fazendaContext =
    inject(FazendaContextService);

  readonly nomeUsuario = signal('');

  readonly saudacao =
    this.obterSaudacao();

  readonly dataHoje =
    new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(new Date());


  private readonly animalService = inject(AnimalService);
  private readonly rebanhoService = inject(RebanhoService);
  private readonly registroPesoService = inject(RegistroPesoService);
  private readonly funcionarioService = inject(FuncionarioService);

  readonly totalRebanhos = signal<number | null>(null);
  readonly totalAnimais = signal<number | null>(null);
  readonly totalPesagens = signal<number | null>(null);
  readonly totalFuncionarios = signal<number | null>(null);
  readonly ultimasPesagens = signal<RegistroPesoResponse[]>([]);
  readonly funcionarios = signal<{ nomeUsuario: string; cargo: string }[]>([]);
  readonly carregandoPesagens = signal(false);
  readonly erros = signal<string[]>([]);

  constructor() {
    this.usuarioContextService.getContexto().pipe(takeUntilDestroyed()).subscribe({
      next: usuario => this.nomeUsuario.set(usuario.name?.trim() ?? ''),
      error: () => this.nomeUsuario.set('')
    });

    effect(onCleanup => {
      const fazendaId = this.fazendaContext.fazendaAtivaId();
      const subscriptions = new Subscription();
      onCleanup(() => subscriptions.unsubscribe());

      this.totalRebanhos.set(null);
      this.totalAnimais.set(null);
      this.totalPesagens.set(null);
      this.totalFuncionarios.set(null);
      this.ultimasPesagens.set([]);
      this.funcionarios.set([]);
      this.erros.set([]);
      this.carregandoPesagens.set(false);
      if (!fazendaId) return;

      const falha = (mensagem: string) => this.erros.update(erros => [...erros, mensagem]);
      subscriptions.add(this.rebanhoService.listarPorFazenda(fazendaId).subscribe({
        next: rebanhos => this.totalRebanhos.set(rebanhos.length),
        error: () => falha('Não foi possível carregar os rebanhos.')
      }));
      subscriptions.add(this.funcionarioService.listarPorFazenda(fazendaId).subscribe({
        next: funcionarios => {
          this.totalFuncionarios.set(funcionarios.length);
          this.funcionarios.set(funcionarios);
        },
        error: () => falha('Não foi possível carregar os funcionários.')
      }));
      this.carregandoPesagens.set(true);
      subscriptions.add(this.animalService.listarPorFazenda(fazendaId).subscribe({
        next: animais => {
          this.totalAnimais.set(animais.length);
          // A API oferece histórico por animal; limita as consultas simultâneas.
          subscriptions.add(from(animais).pipe(
            mergeMap(animal => this.registroPesoService.listarHistorico(animal.id), 5),
            toArray()
          ).subscribe({
            next: historicos => {
              const pesagens = historicos.flat();
              this.totalPesagens.set(pesagens.length);
              this.ultimasPesagens.set(pesagens.sort((a, b) =>
                new Date(b.dataRegistro).getTime() - new Date(a.dataRegistro).getTime()
              ).slice(0, 5));
              this.carregandoPesagens.set(false);
            },
            error: () => {
              this.carregandoPesagens.set(false);
              falha('Não foi possível carregar as pesagens.');
            }
          }));
        },
        error: () => {
          this.carregandoPesagens.set(false);
          falha('Não foi possível carregar os animais e suas pesagens.');
        }
      }));
    });
  }

  private obterSaudacao(): string {

    const hora = new Date().getHours();

    if (hora < 12) return 'Bom dia';
    if (hora < 18) return 'Boa tarde';

    return 'Boa noite';

  }

}