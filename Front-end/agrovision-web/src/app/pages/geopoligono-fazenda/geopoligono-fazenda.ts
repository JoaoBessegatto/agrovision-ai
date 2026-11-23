import {
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';

import {
  DecimalPipe
} from '@angular/common';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  MatIconModule
} from '@angular/material/icon';

import {
  finalize,
  forkJoin
} from 'rxjs';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import mapboxgl from 'mapbox-gl';

import {
  TerraDraw,
  TerraDrawPolygonMode,
  TerraDrawSelectMode,
  ValidateNotSelfIntersecting
} from 'terra-draw';

import {
  TerraDrawMapboxGLAdapter
} from 'terra-draw-mapbox-gl-adapter';

import {
  MAPBOX_ACCESS_TOKEN
} from '../../core/config/mapbox.config';

import {
  MAPTILER_API_KEY
} from '../../core/config/maptiler.config';

import {
  FazendaService
} from '../../core/fazenda/services/fazenda.service';

import {
  FazendaGeopoligonoService
} from '../../core/fazenda/services/fazenda-geopoligono.service';

import {
  FazendaContextService
} from '../../core/fazenda/services/fazenda-context.service';

import {
  FazendaResponse
} from '../../core/fazenda/models/fazenda-response';

import {
  FazendaGeopoligonoResponse,
  GeoJsonPolygon
} from '../../core/fazenda/models/fazenda-geopoligono';

import {
  AreaManejo,
  AreaManejoRequest,
  ResumoAreasManejo,
  TipoAreaManejo
} from '../../core/area-manejo/models/area-manejo';

import {
  AreaManejoService
} from '../../core/area-manejo/services/area-manejo.service';

import {
  RebanhoResponse
} from '../../core/rebanho/models/rebanho-response';

import {
  RebanhoService
} from '../../core/rebanho/services/rebanho.service';


type ModoMapa =
  | 'SATELITE'
  | 'MAPA';

type ModoEdicao =
  | 'NAVEGAR'
  | 'DESENHAR'
  | 'EDITAR';

type ModoGestaoTerritorial =
  | 'LIMITE'
  | 'PIQUETES';


@Component({
  selector: 'app-geopoligono-fazenda',
  standalone: true,

  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    MatIconModule
  ],

  templateUrl: './geopoligono-fazenda.html',
  styleUrl: './geopoligono-fazenda.scss'
})
export class GeopoligonoFazenda
  implements OnInit, OnDestroy {

  private mapContainer?:
    ElementRef<HTMLDivElement>;

  @ViewChild(
    'mapContainer'
  )
  set mapContainerRef(
    ref: ElementRef<HTMLDivElement> | undefined
  ) {

    if (!ref) {
      this.destruirMapa();
    }

    this.mapContainer = ref;

    if (
      ref &&
      this.mapaConfigurado()
    ) {

      queueMicrotask(
        () => this.inicializarMapa()
      );
    }
  }


  private readonly destroyRef = inject(DestroyRef);

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly fazendaService =
    inject(FazendaService);

  private readonly geopoligonoService =
    inject(FazendaGeopoligonoService);

  private readonly areaManejoService =
    inject(AreaManejoService);

  private readonly rebanhoService =
    inject(RebanhoService);

  private readonly formBuilder =
    inject(FormBuilder);

  readonly fazendaContext =
    inject(FazendaContextService);


  readonly onboarding =
    this.route.snapshot.data['onboarding']
      === true;

  readonly fazenda =
    signal<FazendaResponse | null>(null);

  readonly geopoligonoSalvo =
    signal<FazendaGeopoligonoResponse | null>(
      null
    );

  readonly geometriaAtual =
    signal<GeoJsonPolygon | null>(null);

  readonly areaPreviewHa =
    signal<number | null>(null);

  readonly loading =
    signal(false);

  readonly saving =
    signal(false);

  readonly removendo =
    signal(false);

  readonly buscandoLocal =
    signal(false);

  readonly errorMessage =
    signal('');

  readonly successMessage =
    signal('');

  readonly alteracoesPendentes =
    signal(false);

  readonly podeEditar =
    signal(false);

  readonly mapaConfigurado =
    signal(
      MAPBOX_ACCESS_TOKEN
        .trim()
        .startsWith('pk.')
    );

  readonly sateliteConfigurado =
    signal(
      MAPTILER_API_KEY
        .trim()
        .length > 0
    );

  readonly mapaPronto =
    signal(false);

  readonly modoMapa =
    signal<ModoMapa>(
      MAPTILER_API_KEY
        .trim()
        .length > 0
          ? 'SATELITE'
          : 'MAPA'
    );

  readonly modoEdicao =
    signal<ModoEdicao>('NAVEGAR');

  readonly buscaLocal =
    signal('');


  readonly modoGestao =
    signal<ModoGestaoTerritorial>(
      'LIMITE'
    );

  readonly resumoAreas =
    signal<ResumoAreasManejo | null>(
      null
    );


  readonly analisePiquetes =
    computed(() => {

      const resumo =
        this.resumoAreas();

      if (!resumo) {
        return null;
      }

      const pastos =
        resumo.areas
          .filter(area =>
            area.tipo === 'PASTO' &&
            area.rebanhoId !== null
          );

      const pastosComLotacao =
        pastos
          .filter(area =>
            area.indicadores
              .uaPorHa !== null
          );

      const areaPastosComRebanhoHa =
        pastos
          .reduce(
            (
              total,
              area
            ) =>
              total +
              area.areaCalculadaHa,
            0
          );

      const totalUaPastos =
        pastos
          .reduce(
            (
              total,
              area
            ) =>
              total +
              (
                area.indicadores
                  .unidadesAnimais ??
                0
              ),
            0
          );

      const totalAnimaisPastos =
        pastos
          .reduce(
            (
              total,
              area
            ) =>
              total +
              area.indicadores
                .animaisAtivos,
            0
          );

      const mediaUaPorHa =
        areaPastosComRebanhoHa > 0
          ? totalUaPastos /
              areaPastosComRebanhoHa
          : null;

      const mediaCabecasPorHa =
        areaPastosComRebanhoHa > 0
          ? totalAnimaisPastos /
              areaPastosComRebanhoHa
          : null;

      const maiorLotacao =
        pastosComLotacao
          .reduce<AreaManejo | null>(
            (
              maior,
              area
            ) => {

              if (!maior) {
                return area;
              }

              return (
                area.indicadores
                  .uaPorHa ?? 0
              ) >
                (
                  maior.indicadores
                    .uaPorHa ?? 0
                )
                  ? area
                  : maior;
            },
            null
          );

      const menorLotacao =
        pastosComLotacao
          .reduce<AreaManejo | null>(
            (
              menor,
              area
            ) => {

              if (!menor) {
                return area;
              }

              return (
                area.indicadores
                  .uaPorHa ??
                Number.POSITIVE_INFINITY
              ) <
                (
                  menor.indicadores
                    .uaPorHa ??
                  Number.POSITIVE_INFINITY
                )
                  ? area
                  : menor;
            },
            null
          );

      const confinamentosAcimaCapacidade =
        resumo.areas
          .filter(area =>
            area.tipo ===
              'CONFINAMENTO' &&
            area.indicadores
              .statusConfinamento ===
              'ACIMA_CAPACIDADE'
          );

      const confinamentosLotados =
        resumo.areas
          .filter(area =>
            area.tipo ===
              'CONFINAMENTO' &&
            area.indicadores
              .statusConfinamento ===
              'LOTADO'
          );

      return {
        mediaUaPorHa,
        mediaCabecasPorHa,
        maiorLotacao,
        menorLotacao,
        confinamentosAcimaCapacidade,
        confinamentosLotados,
        rebanhosSemArea:
          resumo.rebanhosSemArea,
        animaisAtivosEmAreas:
          resumo.animaisAtivosEmAreas,
        percentualAreaMapeada:
          resumo.percentualAreaMapeada
      };
    });

  readonly rebanhos =
    signal<RebanhoResponse[]>([]);

  readonly piqueteGeometria =
    signal<GeoJsonPolygon | null>(
      null
    );

  readonly piqueteAreaPreviewHa =
    signal<number | null>(
      null
    );


  readonly piqueteFinalizado =
    signal(false);

  readonly piqueteSaving =
    signal(false);

  readonly piqueteDeleting =
    signal(false);

  readonly piquetesLoading =
    signal(false);

  readonly piqueteSelecionado =
    signal<AreaManejo | null>(
      null
    );

  readonly piqueteForm =
    this.formBuilder.group({

      nome: [
        '',
        [
          Validators.required,
          Validators.maxLength(120)
        ]
      ],

      descricao: [
        '',
        [
          Validators.maxLength(500)
        ]
      ],

      tipo: [
        'PASTO' as TipoAreaManejo,
        [
          Validators.required
        ]
      ],

      capacidadeMaximaCabecas: [
        null as number | null,
        [
          Validators.min(1)
        ]
      ],

      rebanhoId: [
        ''
      ]
    });


  private map:
    mapboxgl.Map | null = null;

  private draw:
    TerraDraw | null = null;

  private mapLoaded = false;

  private loadedFazendaId:
    string | null = null;

  private featureId:
    string | number | null = null;

  /*
   * Evita tratar clear/addFeatures usados para
   * carregar geometria salva como edição manual.
   */
  private sincronizandoMapa = false;

  private readonly toleranciaSnapPiquetePx =
    8;

  /*
   * Terra Draw valida a precisão das coordenadas.
   * O renderer pode devolver 12-15 casas via unproject(),
   * então normalizamos antes de armazenar/salvar.
   */
  private readonly precisaoCoordenadas =
    8;


  constructor() {

    if (!this.onboarding) {

      effect(() => {

        const fazendaId =
          this.fazendaContext
            .fazendaAtivaId();

        const podeEditar =
          this.fazendaContext
            .ehProprietario();

        if (
          fazendaId &&
          fazendaId !==
            this.loadedFazendaId
        ) {

          this.carregar(
            fazendaId,
            podeEditar
          );
        }

        this.podeEditar.set(
          podeEditar
        );
      });
    }
  }


  ngOnInit(): void {

    if (!this.onboarding) {
      return;
    }

    const fazendaId =
      this.route.snapshot
        .paramMap
        .get('fazendaId');

    if (!fazendaId) {

      this.router.navigate([
        '/app'
      ]);

      return;
    }

    this.carregar(
      fazendaId,
      true
    );
  }


  ngOnDestroy(): void {
    this.destruirMapa();
  }

  private destruirMapa(): void {

    try {
      this.draw?.stop();
    } catch {
      // O mapa pode ter sido destruído antes do Terra Draw.
    }

    this.draw = null;

    this.map?.remove();
    this.map = null;
    this.mapLoaded = false;
    this.mapaPronto.set(false);
    this.featureId = null;
  }


  iniciarDesenho(): void {

    if (
      !this.podeEditar() ||
      !this.draw
    ) {
      return;
    }

    if (this.geometriaAtual()) {

      this.errorMessage.set(
        'Já existe um limite desenhado. Limpe o desenho atual ou use Editar pontos.'
      );

      return;
    }

    this.limparMensagens();

    this.draw.setMode(
      'polygon'
    );

    this.modoEdicao.set(
      'DESENHAR'
    );
  }


  editarPontos(): void {

    if (
      !this.podeEditar() ||
      !this.draw ||
      this.featureId === null
    ) {
      return;
    }

    this.limparMensagens();

    this.draw.setMode(
      'select'
    );

    this.draw.selectFeature(
      this.featureId as string
    );

    this.modoEdicao.set(
      'EDITAR'
    );
  }


  navegar(): void {

    if (!this.draw) {
      return;
    }

    this.draw.setMode(
      'select'
    );

    if (this.featureId !== null) {

      this.draw.deselectFeature(
        this.featureId as string
      );
    }

    this.modoEdicao.set(
      'NAVEGAR'
    );
  }


  limparDesenho(): void {

    if (
      !this.podeEditar() ||
      !this.draw
    ) {
      return;
    }

    this.draw.clear();

    this.featureId = null;

    this.geometriaAtual.set(
      null
    );

    this.areaPreviewHa.set(
      null
    );

    this.alteracoesPendentes.set(
      true
    );

    this.modoEdicao.set(
      'NAVEGAR'
    );

    this.limparMensagens();
  }


  salvar(): void {

    const fazendaId =
      this.loadedFazendaId;

    const geometry =
      this.geometriaAtual();

    if (
      !fazendaId ||
      !geometry ||
      !this.podeEditar()
    ) {

      this.errorMessage.set(
        'Desenhe o limite da propriedade antes de salvar.'
      );

      return;
    }

    this.saving.set(true);
    this.limparMensagens();

    this.geopoligonoService
      .salvar(
        fazendaId,
        {
          geometry
        }
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() =>
          this.saving.set(false)
        )
      )
      .subscribe({

        next: response => {

          this.geopoligonoSalvo.set(
            response
          );

          this.areaPreviewHa.set(
            response.areaCalculadaHa
          );

          this.alteracoesPendentes.set(
            false
          );

          this.successMessage.set(
            'Limite da propriedade salvo com sucesso.'
          );

          this.navegar();
        },

        error: error => {

          this.errorMessage.set(
            this.extrairMensagemErro(
              error,
              'Não foi possível salvar o limite da propriedade.'
            )
          );
        }
      });
  }


  removerGeopoligono(): void {

    const fazendaId =
      this.loadedFazendaId;

    if (
      !fazendaId ||
      !this.podeEditar() ||
      this.removendo()
    ) {
      return;
    }

    const confirmou =
      window.confirm(
        'Remover a delimitação salva desta fazenda? Os dados cadastrais da propriedade não serão excluídos.'
      );

    if (!confirmou) {
      return;
    }

    this.removendo.set(true);
    this.limparMensagens();

    this.geopoligonoService
      .remover(
        fazendaId
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() =>
          this.removendo.set(false)
        )
      )
      .subscribe({

        next: () => {

          this.draw?.clear();

          this.featureId = null;

          this.geometriaAtual.set(
            null
          );

          this.areaPreviewHa.set(
            null
          );

          this.geopoligonoSalvo.set({
            fazendaId,
            configurado: false,
            geometry: null,
            areaCalculadaHa: null,
            areaInformadaHa:
              this.fazenda()
                ?.areaTotalHa ?? null,
            diferencaAreaHa: null,
            diferencaPercentual: null,
            centroideLatitude:
              this.fazenda()
                ?.latitude ?? null,
            centroideLongitude:
              this.fazenda()
                ?.longitude ?? null,
            atualizadoEm: null
          });

          this.alteracoesPendentes.set(
            false
          );

          this.successMessage.set(
            'Delimitação removida.'
          );
        },

        error: error => {

          this.errorMessage.set(
            this.extrairMensagemErro(
              error,
              'Não foi possível remover a delimitação.'
            )
          );
        }
      });
  }


  abrirPiquetes(): void {

    if (
      this.onboarding ||
      !this.geopoligonoSalvo()
        ?.configurado ||
      !this.geometriaAtual()
    ) {

      this.errorMessage.set(
        'Salve primeiro o limite da Fazenda para delimitar os piquetes.'
      );

      return;
    }

    this.limparMensagens();

    this.modoGestao.set(
      'PIQUETES'
    );

    this.cancelarNovoPiquete(
      false
    );

    if (
      this.sateliteConfigurado() &&
      this.modoMapa() !==
        'SATELITE'
    ) {

      this.alterarMapa(
        'SATELITE'
      );

      return;
    }

    this.aplicarDadosNoMapa();
  }


  abrirLimiteFazenda(): void {

    this.limparMensagens();

    this.modoGestao.set(
      'LIMITE'
    );

    this.cancelarNovoPiquete(
      false
    );

    if (this.map) {

      this.removerRestricaoDoMapa();
    }

    this.removerCamadasPiquetes();
    this.aplicarDadosNoMapa();
  }


  iniciarNovoPiquete(): void {

    if (
      !this.podeEditar() ||
      this.modoGestao() !==
        'PIQUETES' ||
      !this.draw
    ) {
      return;
    }

    this.limparMensagens();

    this.sincronizandoMapa =
      true;

    this.draw.clear();

    this.sincronizandoMapa =
      false;

    this.featureId = null;

    this.piqueteGeometria.set(
      null
    );

    this.piqueteAreaPreviewHa.set(
      null
    );

    this.piqueteFinalizado.set(
      false
    );

    this.piqueteSelecionado.set(
      null
    );

    this.piqueteForm.reset({
      nome: '',
      descricao: '',
      tipo: 'PASTO',
      capacidadeMaximaCabecas: null,
      rebanhoId: ''
    });

    this.modoEdicao.set(
      'DESENHAR'
    );

    this.draw.setMode(
      'polygon'
    );
  }


  cancelarNovoPiquete(
    reRenderizar = true
  ): void {

    this.sincronizandoMapa =
      true;

    this.draw?.clear();

    this.sincronizandoMapa =
      false;

    this.featureId = null;

    this.piqueteGeometria.set(
      null
    );

    this.piqueteAreaPreviewHa.set(
      null
    );

    this.piqueteFinalizado.set(
      false
    );

    this.modoEdicao.set(
      'NAVEGAR'
    );

    this.piqueteForm.reset({
      nome: '',
      descricao: '',
      tipo: 'PASTO',
      capacidadeMaximaCabecas: null,
      rebanhoId: ''
    });

    if (reRenderizar) {
      this.renderizarCamadasPiquetes();
    }
  }


  alterarTipoPiquete(): void {

    if (
      this.piqueteForm.controls
        .tipo.value === 'PASTO'
    ) {

      this.piqueteForm.controls
        .capacidadeMaximaCabecas
        .setValue(
          null
        );
    }
  }


  salvarPiquete(): void {

    if (this.piqueteSaving()) {
      return;
    }

    const fazendaId =
      this.loadedFazendaId;

    const geometry =
      this.piqueteGeometria();

    if (
      !fazendaId ||
      !geometry ||
      !this.piqueteFinalizado() ||
      !this.podeEditar()
    ) {

      this.errorMessage.set(
        'Conclua o desenho do piquete dentro do limite da Fazenda antes de salvar.'
      );

      return;
    }

    if (this.piqueteForm.invalid) {

      this.piqueteForm
        .markAllAsTouched();

      this.errorMessage.set(
        'Preencha os campos obrigatórios do piquete.'
      );

      return;
    }

    const normalizada =
      this.normalizarPiqueteAoLimite(
        geometry
      );

    if (!normalizada.valida) {

      this.piqueteFinalizado.set(
        false
      );

      this.errorMessage.set(
        'O piquete precisa ficar totalmente dentro do limite amarelo da Fazenda.'
      );

      return;
    }

    const geometryRequest =
      this.normalizarPrecisaoGeometria(
        normalizada.geometry
      );

    const raw =
      this.piqueteForm
        .getRawValue();

    const nome =
      raw.nome?.trim() ?? '';

    if (!nome) {

      this.errorMessage.set(
        'Informe um nome para o piquete.'
      );

      return;
    }

    const nomeNormalizado =
      nome.toLocaleLowerCase(
        'pt-BR'
      );

    const nomeJaExiste =
      (
        this.resumoAreas()
          ?.areas ?? []
      )
        .some(area =>
          area.nome
            .trim()
            .toLocaleLowerCase(
              'pt-BR'
            ) ===
              nomeNormalizado
        );

    if (nomeJaExiste) {

      this.errorMessage.set(
        'Já existe um piquete com este nome nesta Fazenda.'
      );

      return;
    }

    const descricao =
      raw.descricao?.trim() ?? '';

    const request:
      AreaManejoRequest = {

        nome,

        descricao:
          descricao
            ? descricao
            : null,

        tipo:
          (
            raw.tipo ??
            'PASTO'
          ) as TipoAreaManejo,

        geometry:
          geometryRequest,

        capacidadeMaximaCabecas:
          raw.tipo ===
            'CONFINAMENTO'
            ? raw
                .capacidadeMaximaCabecas
            : null,

        rebanhoId:
          raw.rebanhoId
            ? raw.rebanhoId
            : null
      };

    this.piqueteSaving.set(
      true
    );

    this.limparMensagens();

    this.areaManejoService
      .cadastrar(
        fazendaId,
        request
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() =>
          this.piqueteSaving.set(
            false
          )
        )
      )
      .subscribe({

        next: area => {

          this.successMessage.set(
            `Piquete "${area.nome}" salvo com sucesso.`
          );

          this.cancelarNovoPiquete(
            false
          );

          this.carregarAreasManejo(
            fazendaId,
            area.id
          );
        },

        error: error => {

          const mensagem =
            this.extrairMensagemErro(
              error,
              'Não foi possível salvar o piquete.'
            );

          console.error(
            'Erro ao salvar piquete:',
            {
              status:
                error?.status,
              mensagem,
              resposta:
                error?.error
            }
          );

          this.errorMessage.set(
            mensagem
          );
        }
      });
  }

  selecionarPiquete(
    area: AreaManejo
  ): void {

    if (
      this.modoEdicao() !==
        'NAVEGAR'
    ) {
      return;
    }

    this.piqueteSelecionado.set(
      area
    );

    this.renderizarCamadasPiquetes();

    this.enquadrarPoligono(
      area.geometry
    );
  }


  excluirPiquete(
    area: AreaManejo
  ): void {

    if (
      !this.podeEditar() ||
      this.piqueteDeleting()
    ) {
      return;
    }

    const confirmou =
      window.confirm(
        `Excluir o piquete "${area.nome}"? O rebanho associado não será excluído.`
      );

    if (!confirmou) {
      return;
    }

    this.piqueteDeleting.set(
      true
    );

    this.limparMensagens();

    this.areaManejoService
      .deletar(
        area.id
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() =>
          this.piqueteDeleting.set(
            false
          )
        )
      )
      .subscribe({

        next: () => {

          if (
            this.piqueteSelecionado()
              ?.id === area.id
          ) {

            this.piqueteSelecionado.set(
              null
            );
          }

          this.successMessage.set(
            'Piquete excluído.'
          );

          if (this.loadedFazendaId) {

            this.carregarAreasManejo(
              this.loadedFazendaId
            );
          }
        },

        error: error => {

          this.errorMessage.set(
            this.extrairMensagemErro(
              error,
              'Não foi possível excluir o piquete.'
            )
          );
        }
      });
  }


  corPiquete(
    area: AreaManejo
  ): string {

    return this.corPorId(
      area.id
    );
  }


  labelTipoPiquete(
    tipo: TipoAreaManejo
  ): string {

    return tipo ===
      'CONFINAMENTO'
        ? 'Confinamento'
        : 'Pasto';
  }


  rebanhosDisponiveisPiquete():
    RebanhoResponse[] {

    const ocupados =
      new Set(
        (
          this.resumoAreas()
            ?.areas ?? []
        )
          .map(area =>
            area.rebanhoId
          )
          .filter(
            (
              id
            ): id is string =>
              Boolean(id)
          )
      );

    return this.rebanhos()
      .filter(rebanho =>
        !ocupados.has(
          rebanho.id
        )
      );
  }


  alterarMapa(
    modo: ModoMapa
  ): void {

    if (
      modo === 'SATELITE' &&
      !this.sateliteConfigurado()
    ) {

      this.errorMessage.set(
        'Configure a chave pública do MapTiler para habilitar a imagem de satélite.'
      );

      return;
    }

    if (this.map && !this.mapLoaded) {
      return;
    }

    this.modoMapa.set(
      modo
    );

    if (!this.map) {
      return;
    }

    try {
      this.draw?.stop();
    } catch {
      // A troca de estilo recria as camadas do Terra Draw.
    }

    this.draw = null;
    this.featureId = null;
    this.mapaPronto.set(false);

    this.mapLoaded = false;

    this.map.once(
      'style.load',
      () => {

        this.mapLoaded = true;
        this.inicializarTerraDraw();
        this.modoEdicao.set('NAVEGAR');
        this.mapaPronto.set(true);

        this.aplicarDadosNoMapa();
      }
    );

    this.map.setStyle(this.styleDefinition(modo));
  }


  atualizarBusca(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    this.buscaLocal.set(
      input.value
    );
  }


  async buscarNoMapa(): Promise<void> {

    const termo =
      this.buscaLocal()
        .trim();

    if (
      !termo ||
      !this.map ||
      !this.mapaConfigurado()
    ) {
      return;
    }

    this.buscandoLocal.set(true);
    this.errorMessage.set('');

    try {

      const url =
        'https://api.mapbox.com/search/geocode/v6/forward' +
        `?q=${encodeURIComponent(termo)}` +
        '&country=br&language=pt&limit=5' +
        `&access_token=${encodeURIComponent(MAPBOX_ACCESS_TOKEN)}`;

      const response =
        await fetch(url);

      if (!response.ok) {
        throw new Error(
          'Falha ao consultar localização.'
        );
      }

      const data =
        await response.json();

      const feature =
        data?.features?.[0];

      const coordinates =
        feature?.geometry
          ?.coordinates;

      if (
        !Array.isArray(coordinates) ||
        coordinates.length < 2
      ) {

        this.errorMessage.set(
          'Local não encontrado. Tente buscar pela cidade, propriedade ou endereço mais próximo.'
        );

        return;
      }

      this.map.flyTo({
        center: [
          Number(coordinates[0]),
          Number(coordinates[1])
        ],
        zoom: 16,
        duration: 1200
      });

    } catch (error) {

      console.error(
        'Erro ao buscar local no Mapbox:',
        error
      );

      this.errorMessage.set(
        'Não foi possível pesquisar este local no mapa.'
      );

    } finally {

      this.buscandoLocal.set(false);
    }
  }


  concluirOuPular(): void {

    if (
      this.alteracoesPendentes() &&
      this.geometriaAtual()
    ) {

      const confirmou =
        window.confirm(
          'Existe uma alteração no mapa que ainda não foi salva. Deseja continuar mesmo assim?'
        );

      if (!confirmou) {
        return;
      }
    }

    this.router.navigate([
      '/app'
    ]);
  }


  voltar(): void {

    if (this.onboarding) {

      this.router.navigate([
        '/app'
      ]);

      return;
    }

    this.router.navigate([
      '/app'
    ]);
  }


  limparMensagens(): void {

    this.errorMessage.set('');
    this.successMessage.set('');
  }


  private carregar(
    fazendaId: string,
    podeEditar: boolean
  ): void {

    this.loadedFazendaId =
      fazendaId;

    this.loading.set(true);
    this.modoGestao.set('LIMITE');
    this.cancelarNovoPiquete(false);
    this.piqueteSelecionado.set(null);
    this.resumoAreas.set(null);
    this.rebanhos.set([]);
    this.podeEditar.set(
      podeEditar
    );

    this.limparMensagens();

    forkJoin({
      fazenda:
        this.fazendaService
          .buscarPorId(
            fazendaId
          ),

      geopoligono:
        this.geopoligonoService
          .buscar(
            fazendaId
          )
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() =>
          this.loading.set(false)
        )
      )
      .subscribe({

        next: response => {

          if (
            this.loadedFazendaId !==
            fazendaId
          ) {
            return;
          }

          this.fazenda.set(
            response.fazenda
          );

          this.geopoligonoSalvo.set(
            response.geopoligono
          );

          this.geometriaAtual.set(
            response.geopoligono
              .geometry
          );

          this.areaPreviewHa.set(
            response.geopoligono
              .areaCalculadaHa
          );

          this.alteracoesPendentes.set(
            false
          );

          this.buscaLocal.set(
            `${response.fazenda.nome}, ${response.fazenda.cidade} - ${response.fazenda.estado}`
          );

          this.aplicarDadosNoMapa();

          if (
            !this.onboarding &&
            response.geopoligono
              .configurado
          ) {

            this.carregarAreasManejo(
              fazendaId
            );
          }
        },

        error: error => {

          console.error(
            'Erro ao carregar geopolígono:',
            error
          );

          this.errorMessage.set(
            this.extrairMensagemErro(
              error,
              'Não foi possível carregar os dados geográficos da fazenda.'
            )
          );
        }
      });
  }


  private inicializarMapa(): void {

    if (
      this.destroyRef.destroyed ||
      this.map ||
      !this.mapContainer
    ) {
      return;
    }

    this.map =
      new mapboxgl.Map({

        accessToken:
          MAPBOX_ACCESS_TOKEN,

        container:
          this.mapContainer
            .nativeElement,

        style:
          this.styleDefinition(
            this.modoMapa()
          ),

        center: [
          -51.9253,
          -14.235
        ],

        zoom: 4,

        /*
         * O controle territorial funciona em planta:
         * norte para cima e visão perpendicular ao solo.
         */
        bearing: 0,
        pitch: 0,
        minPitch: 0,
        maxPitch: 0,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        projection: 'mercator',
        performanceMetricsCollection:
          false
      });


    this.map.addControl(
      new mapboxgl.NavigationControl({
        showCompass: false,
        showZoom: true
      }),
      'top-right'
    );

    /*
     * Mantém pinch-to-zoom em telas touch,
     * mas bloqueia qualquer rotação.
     */
    this.map.touchZoomRotate
      .disableRotation();


    this.map.addControl(
      new mapboxgl.ScaleControl({
        unit: 'metric'
      }),
      'bottom-left'
    );


    this.map.once(
      'style.load',
      () => {

        this.mapLoaded = true;

        this.mapaPronto.set(
          true
        );

        this.inicializarTerraDraw();

        this.aplicarDadosNoMapa();
      }
    );


    this.map.on(
      'error',
      event => {

        const mensagem =
          event.error?.message ?? '';

        if (
          this.modoMapa() ===
            'SATELITE' &&
          mensagem
        ) {

          console.error(
            'Erro no mapa de satélite:',
            event.error
          );

          this.mapaPronto.set(
            true
          );

          this.errorMessage.set(
            'A imagem de satélite não pôde ser carregada. Verifique a chave do MapTiler e tente novamente.'
          );
        }
      }
    );
  }


  private inicializarTerraDraw(): void {

    if (
      !this.map ||
      this.draw
    ) {
      return;
    }

    this.draw =
      new TerraDraw({

        adapter:
          new TerraDrawMapboxGLAdapter({
            map: this.map,
            ignoreMismatchedPointerEvents:
              true
          }),

        modes: [

          new TerraDrawPolygonMode({

            validation: (
              feature,
              { updateType }
            ) => {

              if (
                updateType === 'finish' ||
                updateType === 'commit'
              ) {

                const autoIntersecao =
                  ValidateNotSelfIntersecting(
                    feature
                  );

                if (!autoIntersecao.valid) {
                  return autoIntersecao;
                }

                if (
                  this.modoGestao() ===
                    'PIQUETES' &&
                  feature.geometry.type ===
                    'Polygon'
                ) {

                  const geometry:
                    GeoJsonPolygon = {

                      type: 'Polygon',

                      coordinates:
                        feature.geometry
                          .coordinates as number[][][]
                    };

                  if (
                    !this
                      .normalizarPiqueteAoLimite(
                        geometry
                      )
                      .valida
                  ) {

                    return {
                      valid: false
                    };
                  }
                }
              }

              return {
                valid: true
              };
            },

            styles: {
              fillColor: '#e2a82e',
              fillOpacity: 0.24,
              outlineColor: '#fff3c6',
              outlineWidth: 3
            }
          }),

          new TerraDrawSelectMode({

            allowManualDeselection: true,

            flags: {
              polygon: {
                feature: {
                  draggable: false,
                  coordinates: {

                    midpoints: {
                      draggable: true
                    },

                    draggable: true,

                    deletable: true
                  }
                }
              }
            },

            styles: {
              selectedPolygonColor:
                '#e2a82e',
              selectedPolygonFillOpacity:
                0.28,
              selectedPolygonOutlineColor:
                '#ffffff',
              selectedPolygonOutlineWidth:
                3
            }
          })
        ]
      });


    this.draw.start();


    this.draw.on(
      'change',
      () => {

        if (this.sincronizandoMapa) {
          return;
        }

        this.sincronizarDesenho();
      }
    );


    this.draw.on(
      'finish',
      (_id, context) => {

        this.sincronizarDesenho();

        if (
          context.action === 'draw'
        ) {

          if (
            this.modoGestao() ===
              'PIQUETES'
          ) {

            this.modoEdicao.set(
              'EDITAR'
            );

            this.piqueteFinalizado.set(
              this.piqueteGeometria() !==
                null
            );

            this.draw?.setMode(
              'select'
            );

            if (
              this.featureId !== null
            ) {

              this.draw?.selectFeature(
                this.featureId as string
              );
            }

          } else {

            this.modoEdicao.set(
              'NAVEGAR'
            );

            this.draw?.setMode(
              'select'
            );
          }
        }
      }
    );
  }


  private aplicarDadosNoMapa(): void {

    if (
      !this.map ||
      !this.mapLoaded ||
      !this.draw
    ) {
      return;
    }

    this.sincronizandoMapa = true;

    this.draw.clear();
    this.featureId = null;

    if (
      this.modoGestao() ===
        'PIQUETES'
    ) {

      this.sincronizandoMapa = false;

      this.renderizarCamadasPiquetes();
      this.removerRestricaoDoMapa();

      const draft =
        this.piqueteGeometria();

      if (draft) {

        this.carregarGeometriaPiqueteNoDraw(
          draft
        );
        this.modoEdicao.set('EDITAR');
      } else {

        this.draw.setMode(
          'select'
        );
      }

      const limite =
        this.geometriaAtual();

      if (limite) {

        this.enquadrarPoligono(
          limite
        );
      }

      return;
    }

    this.removerCamadasPiquetes();

    if (this.map) {

      this.removerRestricaoDoMapa();
    }

    const geometry =
      this.geometriaAtual();

    if (geometry) {

      const result =
        this.draw.addFeatures([
          {
            type: 'Feature',
            properties: {
              mode: 'polygon'
            },
            geometry
          }
        ]);

      const first =
        result[0];

      if (
        first &&
        first.valid
      ) {

        this.featureId =
          first.id as string;

        this.enquadrarPoligono(
          geometry
        );
      }

      this.sincronizandoMapa = false;

      return;
    }

    this.sincronizandoMapa = false;

    const fazenda =
      this.fazenda();

    if (
      fazenda?.longitude !== null &&
      fazenda?.longitude !== undefined &&
      fazenda?.latitude !== null &&
      fazenda?.latitude !== undefined
    ) {

      this.map.flyTo({
        center: [
          fazenda.longitude,
          fazenda.latitude
        ],
        zoom: 14,
        duration: 700
      });

      return;
    }

    if (fazenda) {

      this.localizarCidade(
        fazenda.cidade,
        fazenda.estado
      );
    }
  }

  private sincronizarDesenho(): void {

    if (
      this.modoGestao() ===
        'PIQUETES'
    ) {

      this.sincronizarDesenhoPiquete();
      return;
    }

    if (!this.draw) {
      return;
    }

    const polygons =
      this.draw
        .getSnapshot()
        .filter(feature =>
          feature.geometry.type ===
            'Polygon' &&
          feature.properties.mode ===
            'polygon'
        );


    if (polygons.length === 0) {

      this.featureId = null;

      this.geometriaAtual.set(
        null
      );

      this.areaPreviewHa.set(
        null
      );
      this.alteracoesPendentes.set(true);

      return;
    }


    /*
     * A Etapa 1 trabalha com um único
     * limite para a fazenda.
     */
    if (polygons.length > 1) {

      const extras =
        polygons
          .slice(0, -1)
          .map(feature =>
            feature.id
          )
          .filter(
            id =>
              id !== undefined
          );

      if (extras.length > 0) {

        this.draw.removeFeatures(
          extras as string[]
        );
      }
    }


    const feature =
      polygons[
        polygons.length - 1
      ];


    if (
      feature.geometry.type !==
      'Polygon'
    ) {
      return;
    }


    const geometry:
      GeoJsonPolygon = {

        type: 'Polygon',

        coordinates:
          feature.geometry
            .coordinates as number[][][]
      };


    this.featureId =
      feature.id as string;


    this.geometriaAtual.set(
      geometry
    );


    this.areaPreviewHa.set(
      this.calcularAreaHa(
        geometry
      )
    );


    this.alteracoesPendentes.set(
      true
    );
  }


  private enquadrarPoligono(
    geometry: GeoJsonPolygon
  ): void {

    if (!this.map) {
      return;
    }

    const ring =
      geometry.coordinates[0];

    if (
      !ring ||
      ring.length === 0
    ) {
      return;
    }

    const bounds =
      new mapboxgl.LngLatBounds();

    ring.forEach(coordinate => {

      bounds.extend([
        coordinate[0],
        coordinate[1]
      ]);
    });

    this.map.fitBounds(
      bounds,
      {
        padding: 70,
        maxZoom: 17,
        duration: 700
      }
    );
  }


  private carregarAreasManejo(
    fazendaId: string,
    selecionarId?: string
  ): void {

    this.piquetesLoading.set(
      true
    );

    forkJoin({

      resumo:
        this.areaManejoService
          .listarResumo(
            fazendaId
          ),

      rebanhos:
        this.rebanhoService
          .listarPorFazenda(
            fazendaId
          )
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() =>
          this.piquetesLoading.set(
            false
          )
        )
      )
      .subscribe({

        next: response => {

          if (
            this.loadedFazendaId !==
              fazendaId
          ) {
            return;
          }

          this.resumoAreas.set(
            response.resumo
          );

          this.rebanhos.set(
            response.rebanhos
          );

          if (selecionarId) {

            this.piqueteSelecionado.set(
              response.resumo
                .areas
                .find(area =>
                  area.id ===
                    selecionarId
                ) ?? null
            );
          }

          if (
            this.modoGestao() ===
              'PIQUETES'
          ) {

            this.renderizarCamadasPiquetes();
          }
        },

        error: error => {

          this.errorMessage.set(
            this.extrairMensagemErro(
              error,
              'Não foi possível carregar os piquetes da Fazenda.'
            )
          );
        }
      });
  }


  private sincronizarDesenhoPiquete(): void {

    if (!this.draw) {
      return;
    }

    const feature =
      this.draw
        .getSnapshot()
        .find(item =>
          item.geometry.type ===
            'Polygon' &&
          item.properties.mode ===
            'polygon'
        );

    if (
      !feature ||
      feature.geometry.type !==
        'Polygon'
    ) {

      this.featureId = null;

      this.piqueteGeometria.set(
        null
      );

      this.piqueteAreaPreviewHa.set(
        null
      );
      this.piqueteFinalizado.set(false);

      return;
    }

    /*
     * IMPORTANTE:
     * não chamamos updateFeatureGeometry/removeFeatures
     * dentro do evento change do Terra Draw.
     *
     * Fazer isso reentra no store interno da biblioteca
     * enquanto ela ainda está processando a mesma feature,
     * causando "No feature with this id" e loops de change.
     */
    const geometry =
      this.normalizarPrecisaoGeometria({

        type: 'Polygon',

        coordinates:
          feature.geometry
            .coordinates as number[][][]
      });

    const normalizada =
      this.normalizarPiqueteAoLimite(
        geometry
      );

    this.featureId =
      feature.id as string;

    if (!normalizada.valida) {

      this.piqueteFinalizado.set(
        false
      );

      this.piqueteGeometria.set(
        null
      );

      this.piqueteAreaPreviewHa.set(
        null
      );

      if (
        !this.errorMessage()
          .includes(
            'limite amarelo'
          )
      ) {

        this.errorMessage.set(
          'O piquete precisa ficar totalmente dentro do limite amarelo da Fazenda.'
        );
      }

      return;
    }

    const geometryFinal =
      this.normalizarPrecisaoGeometria(
        normalizada.geometry
      );

    this.piqueteGeometria.set(
      geometryFinal
    );

    if (
      this.modoEdicao() ===
        'EDITAR'
    ) {

      this.piqueteFinalizado.set(
        true
      );
    }

    this.piqueteAreaPreviewHa.set(
      this.calcularAreaHa(
        geometryFinal
      )
    );

    if (
      this.errorMessage()
        .includes(
          'limite amarelo'
        )
    ) {

      this.errorMessage.set('');
    }
  }

  private carregarGeometriaPiqueteNoDraw(
    geometry: GeoJsonPolygon
  ): void {

    if (!this.draw) {
      return;
    }

    const geometryNormalizada =
      this.normalizarPrecisaoGeometria(
        geometry
      );

    this.sincronizandoMapa =
      true;

    this.draw.clear();

    const result =
      this.draw.addFeatures([
        {
          type: 'Feature',
          properties: {
            mode: 'polygon'
          },
          geometry:
            geometryNormalizada
        }
      ]);

    this.sincronizandoMapa =
      false;

    const first =
      result[0];

    if (
      first &&
      first.valid
    ) {

      this.featureId =
        first.id as string;

      this.draw.setMode(
        'select'
      );

      this.draw.selectFeature(
        this.featureId as string
      );

      this.piqueteFinalizado.set(
        true
      );
    }
  }


  private renderizarCamadasPiquetes(): void {

    // clear()/setData() do Terra Draw deixam as fontes carregando. O estilo
    // já inicializado permite desenhar o limite mesmo sem piquetes.
    if (
      !this.map ||
      !this.mapLoaded ||
      this.modoGestao() !==
        'PIQUETES'
    ) {
      return;
    }

    const limite =
      this.geometriaAtual();

    if (!limite) {
      return;
    }

    this.renderizarMascaraFazenda(
      limite
    );

    const areas =
      this.resumoAreas()
        ?.areas ?? [];

    const featureCollection = {
      type: 'FeatureCollection',
      features:
        areas.map(area => ({
          type: 'Feature',
          properties: {
            id: area.id,
            nome: area.nome,
            tipo: area.tipo,
            cor:
              this.corPiquete(
                area
              ),
            selecionada:
              this.piqueteSelecionado()
                ?.id === area.id
                  ? 1
                  : 0
          },
          geometry:
            area.geometry
        }))
    } as any;

    const areaSource =
      this.map.getSource(
        'geo-page-paddocks'
      ) as mapboxgl.GeoJSONSource | undefined;

    if (areaSource) {

      areaSource.setData(
        featureCollection
      );

    } else {

      this.map.addSource(
        'geo-page-paddocks',
        {
          type: 'geojson',
          data:
            featureCollection
        }
      );

      this.map.addLayer({
        id: 'geo-page-paddocks-fill',
        type: 'fill',
        source: 'geo-page-paddocks',

        paint: {
          'fill-color': [
            'get',
            'cor'
          ],

          'fill-opacity': [
            'case',
            [
              '==',
              [
                'get',
                'selecionada'
              ],
              1
            ],
            0.58,
            0.38
          ]
        }
      });

      this.map.addLayer({
        id: 'geo-page-paddocks-line',
        type: 'line',
        source: 'geo-page-paddocks',

        paint: {
          'line-color': [
            'case',
            [
              '==',
              [
                'get',
                'selecionada'
              ],
              1
            ],
            '#ffffff',
            [
              'get',
              'cor'
            ]
          ],

          'line-width': [
            'case',
            [
              '==',
              [
                'get',
                'selecionada'
              ],
              1
            ],
            4,
            2.5
          ]
        }
      });
    }

    this.renderizarLimiteFixoFazenda(
      limite
    );
  }


  private renderizarMascaraFazenda(
    limite: GeoJsonPolygon
  ): void {

    if (!this.map) {
      return;
    }

    const ring =
      limite.coordinates[0];

    if (
      !ring ||
      ring.length < 4
    ) {
      return;
    }

    const worldRing = [
      [-180, -85],
      [180, -85],
      [180, 85],
      [-180, 85],
      [-180, -85]
    ];

    const farmHole =
      ring
        .map(point => [
          point[0],
          point[1]
        ])
        .reverse();

    const data = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          worldRing,
          farmHole
        ]
      }
    } as any;

    const source =
      this.map.getSource(
        'geo-page-farm-mask'
      ) as mapboxgl.GeoJSONSource | undefined;

    if (source) {

      source.setData(
        data
      );

      return;
    }

    this.map.addSource(
      'geo-page-farm-mask',
      {
        type: 'geojson',
        data
      }
    );

    this.map.addLayer({
      id: 'geo-page-farm-mask',
      type: 'fill',
      source: 'geo-page-farm-mask',

      paint: {
        'fill-color': '#07110a',
        'fill-opacity': 0.88
      }
    });
  }


  private renderizarLimiteFixoFazenda(
    limite: GeoJsonPolygon
  ): void {

    if (!this.map) {
      return;
    }

    const data = {
      type: 'Feature',
      properties: {},
      geometry: limite
    } as any;

    const source =
      this.map.getSource(
        'geo-page-farm-boundary'
      ) as mapboxgl.GeoJSONSource | undefined;

    if (source) {

      source.setData(
        data
      );

      this.trazerLimiteParaFrente();
      return;
    }

    this.map.addSource(
      'geo-page-farm-boundary',
      {
        type: 'geojson',
        data
      }
    );

    this.map.addLayer({
      id: 'geo-page-farm-fill',
      type: 'fill',
      source:
        'geo-page-farm-boundary',

      paint: {
        'fill-color': '#f5c842',
        'fill-opacity': 0.08
      }
    });

    this.map.addLayer({
      id: 'geo-page-farm-line',
      type: 'line',
      source:
        'geo-page-farm-boundary',

      paint: {
        'line-color': '#ffd54a',
        'line-width': 4
      }
    });

    this.trazerLimiteParaFrente();
  }


  private trazerLimiteParaFrente(): void {

    if (!this.map) {
      return;
    }

    if (
      this.map.getLayer(
        'geo-page-farm-fill'
      )
    ) {

      this.map.moveLayer(
        'geo-page-farm-fill'
      );
    }

    if (
      this.map.getLayer(
        'geo-page-farm-line'
      )
    ) {

      this.map.moveLayer(
        'geo-page-farm-line'
      );
    }
  }


  private removerCamadasPiquetes(): void {

    if (
      !this.map ||
      !this.mapLoaded
    ) {
      return;
    }

    for (
      const layer of [
        'geo-page-farm-line',
        'geo-page-farm-fill',
        'geo-page-paddocks-line',
        'geo-page-paddocks-fill',
        'geo-page-farm-mask'
      ]
    ) {

      if (
        this.map.getLayer(
          layer
        )
      ) {

        this.map.removeLayer(
          layer
        );
      }
    }

    for (
      const source of [
        'geo-page-farm-boundary',
        'geo-page-paddocks',
        'geo-page-farm-mask'
      ]
    ) {

      if (
        this.map.getSource(
          source
        )
      ) {

        this.map.removeSource(
          source
        );
      }
    }
  }


  private removerRestricaoDoMapa(): void {
    if (!this.map) {
      return;
    }

    // O Mapbox aceita null em runtime para remover os limites, mas a
    // declaração de setMaxBounds da versão instalada não inclui esse valor.
    const setMaxBounds = this.map.setMaxBounds as (
      bounds: mapboxgl.LngLatBoundsLike | null
    ) => mapboxgl.Map;

    setMaxBounds.call(this.map, null);
    this.map.setMinZoom(0);
  }

  private normalizarPiqueteAoLimite(
    geometry: GeoJsonPolygon
  ): {
    geometry: GeoJsonPolygon;
    ajustada: boolean;
    valida: boolean;
  } {

    const geometrySegura =
      this.normalizarPrecisaoGeometria(
        geometry
      );

    const limite =
      this.geometriaAtual();

    if (!limite) {

      return {
        geometry,
        ajustada: false,
        valida: false
      };
    }

    let ajustada = false;
    let valida = true;

    const coordinates =
      geometrySegura.coordinates
        .map(ring => {

          if (ring.length === 0) {
            return ring;
          }

          const fechado =
            this.mesmoPonto(
              ring[0],
              ring[
                ring.length - 1
              ]
            );

          const pontos =
            fechado
              ? ring.slice(0, -1)
              : [...ring];

          const normalizados =
            pontos.map(point => {

              const normalizado =
                this.normalizarPontoPiquete(
                  point,
                  limite
                );

              if (!normalizado.valido) {
                valida = false;
              }

              if (
                normalizado.ajustado
              ) {
                ajustada = true;
              }

              return normalizado.ponto;
            });

          if (
            normalizados.length > 0
          ) {

            normalizados.push([
              normalizados[0][0],
              normalizados[0][1]
            ]);
          }

          return normalizados;
        });

    const geometryNormalizada:
      GeoJsonPolygon = {

        type: 'Polygon',
        coordinates
      };

    if (
      valida &&
      !this.segmentosPiqueteDentroDoLimite(
        geometryNormalizada,
        limite
      )
    ) {

      valida = false;
    }

    return {
      geometry:
        geometryNormalizada,
      ajustada,
      valida
    };
  }


  private segmentosPiqueteDentroDoLimite(
    geometry: GeoJsonPolygon,
    limite: GeoJsonPolygon
  ): boolean {

    for (
      const ring of geometry.coordinates
    ) {

      for (
        let i = 0;
        i < ring.length - 1;
        i++
      ) {

        const inicio =
          ring[i];

        const fim =
          ring[i + 1];

        /*
         * Em uma Fazenda côncava, dois vértices podem
         * estar dentro enquanto o segmento entre eles
         * atravessa uma região externa. Amostramos a
         * linha para bloquear esse caso antes do POST.
         */
        for (
          let passo = 1;
          passo < 20;
          passo++
        ) {

          const t =
            passo / 20;

          const ponto = [
            inicio[0] +
              (
                fim[0] -
                inicio[0]
              ) * t,
            inicio[1] +
              (
                fim[1] -
                inicio[1]
              ) * t
          ];

          if (
            this.pontoDentroPoligono(
              ponto,
              limite
            )
          ) {
            continue;
          }

          const proximo =
            this.pontoMaisProximoNoLimite(
              ponto,
              limite
            );

          if (
            !proximo ||
            this.distanciaPixels(
              ponto,
              proximo
            ) >
              this.toleranciaSnapPiquetePx
          ) {

            return false;
          }
        }
      }
    }

    return true;
  }


  private normalizarPontoPiquete(
    point: number[],
    limite: GeoJsonPolygon
  ): {
    ponto: number[];
    ajustado: boolean;
    valido: boolean;
  } {

    const dentro =
      this.pontoDentroPoligono(
        point,
        limite
      );

    const proximo =
      this.pontoMaisProximoNoLimite(
        point,
        limite
      );

    if (
      proximo &&
      this.distanciaPixels(
        point,
        proximo
      ) <=
        this.toleranciaSnapPiquetePx
    ) {

      return {
        ponto:
          this.arredondarPonto(
            proximo
          ),
        ajustado:
          !this.mesmoPonto(
            point,
            proximo
          ),
        valido: true
      };
    }

    return {
      ponto:
        this.arredondarPonto(
          point
        ),
      ajustado: false,
      valido: dentro
    };
  }


  private pontoDentroPoligono(
    point: number[],
    polygon: GeoJsonPolygon
  ): boolean {

    const ring =
      polygon.coordinates[0];

    if (
      !ring ||
      ring.length < 3
    ) {
      return false;
    }

    if (
      this.pontoNaBorda(
        point,
        ring
      )
    ) {
      return true;
    }

    const x =
      point[0];

    const y =
      point[1];

    let inside = false;

    for (
      let i = 0,
      j = ring.length - 1;
      i < ring.length;
      j = i++
    ) {

      const xi =
        ring[i][0];

      const yi =
        ring[i][1];

      const xj =
        ring[j][0];

      const yj =
        ring[j][1];

      const intersecta =
        (
          yi > y
        ) !==
          (
            yj > y
          ) &&
        x <
          (
            (
              xj - xi
            ) *
              (
                y - yi
              )
          ) /
            (
              yj -
                yi ||
              Number.EPSILON
            ) +
            xi;

      if (intersecta) {
        inside = !inside;
      }
    }

    return inside;
  }


  private pontoNaBorda(
    point: number[],
    ring: number[][]
  ): boolean {

    const tolerancia =
      1e-10;

    for (
      let i = 0;
      i < ring.length - 1;
      i++
    ) {

      const a =
        ring[i];

      const b =
        ring[i + 1];

      const abX =
        b[0] - a[0];

      const abY =
        b[1] - a[1];

      const apX =
        point[0] - a[0];

      const apY =
        point[1] - a[1];

      const cross =
        Math.abs(
          abX * apY -
          abY * apX
        );

      if (
        cross >
        tolerancia
      ) {
        continue;
      }

      const dot =
        apX * abX +
        apY * abY;

      const lengthSquared =
        abX * abX +
        abY * abY;

      if (
        dot >=
          -tolerancia &&
        dot <=
          lengthSquared +
            tolerancia
      ) {

        return true;
      }
    }

    return false;
  }


  private pontoMaisProximoNoLimite(
    point: number[],
    polygon: GeoJsonPolygon
  ): number[] | null {

    if (!this.map) {
      return null;
    }

    const alvo =
      this.map.project({
        lng: point[0],
        lat: point[1]
      });

    let melhor:
      number[] | null = null;

    let melhorDistancia =
      Number.POSITIVE_INFINITY;

    for (
      const ring of polygon.coordinates
    ) {

      for (
        let i = 0;
        i < ring.length - 1;
        i++
      ) {

        const a =
          this.map.project({
            lng: ring[i][0],
            lat: ring[i][1]
          });

        const b =
          this.map.project({
            lng: ring[i + 1][0],
            lat: ring[i + 1][1]
          });

        const abX =
          b.x - a.x;

        const abY =
          b.y - a.y;

        const tamanho2 =
          abX * abX +
          abY * abY;

        const t =
          tamanho2 === 0
            ? 0
            : Math.max(
                0,
                Math.min(
                  1,
                  (
                    (
                      alvo.x - a.x
                    ) * abX +
                    (
                      alvo.y - a.y
                    ) * abY
                  ) /
                    tamanho2
                )
              );

        const x =
          a.x + abX * t;

        const y =
          a.y + abY * t;

        const dx =
          alvo.x - x;

        const dy =
          alvo.y - y;

        const distancia =
          Math.sqrt(
            dx * dx +
            dy * dy
          );

        if (
          distancia <
          melhorDistancia
        ) {

          const lngLat =
            this.map.unproject([
              x,
              y
            ]);

          melhorDistancia =
            distancia;

          melhor = [
            lngLat.lng,
            lngLat.lat
          ];
        }
      }
    }

    return melhor;
  }


  private distanciaPixels(
    a: number[],
    b: number[]
  ): number {

    if (!this.map) {
      return Number.POSITIVE_INFINITY;
    }

    const pa =
      this.map.project({
        lng: a[0],
        lat: a[1]
      });

    const pb =
      this.map.project({
        lng: b[0],
        lat: b[1]
      });

    const dx =
      pa.x - pb.x;

    const dy =
      pa.y - pb.y;

    return Math.sqrt(
      dx * dx +
      dy * dy
    );
  }


  private mesmoPonto(
    a: number[],
    b: number[]
  ): boolean {

    return (
      Math.abs(
        a[0] - b[0]
      ) < 1e-12 &&
      Math.abs(
        a[1] - b[1]
      ) < 1e-12
    );
  }


  private normalizarPrecisaoGeometria(
    geometry: GeoJsonPolygon
  ): GeoJsonPolygon {

    return {
      type: 'Polygon',

      coordinates:
        geometry.coordinates
          .map(ring =>
            ring.map(point =>
              this.arredondarPonto(
                point
              )
            )
          )
    };
  }


  private arredondarPonto(
    point: number[]
  ): number[] {

    return [
      this.arredondarCoordenada(
        point[0]
      ),
      this.arredondarCoordenada(
        point[1]
      )
    ];
  }


  private arredondarCoordenada(
    value: number
  ): number {

    if (!Number.isFinite(value)) {
      return value;
    }

    return Number(
      value.toFixed(
        this.precisaoCoordenadas
      )
    );
  }


  private clonarGeometria(
    geometry: GeoJsonPolygon
  ): GeoJsonPolygon {

    return this
      .normalizarPrecisaoGeometria(
        geometry
      );
  }


  private corPorId(
    id: string
  ): string {

    let hash = 0;

    for (
      let i = 0;
      i < id.length;
      i++
    ) {

      hash =
        (
          hash * 31 +
          id.charCodeAt(i)
        ) | 0;
    }

    let hue =
      Math.abs(hash) % 360;

    if (
      hue >= 42 &&
      hue <= 70
    ) {

      hue =
        (
          hue + 80
        ) % 360;
    }

    return this.hslParaHex(
      hue,
      64,
      42
    );
  }


  private hslParaHex(
    hue: number,
    saturation: number,
    lightness: number
  ): string {

    const s =
      saturation / 100;

    const l =
      lightness / 100;

    const chroma =
      (
        1 -
        Math.abs(
          2 * l - 1
        )
      ) * s;

    const x =
      chroma *
      (
        1 -
        Math.abs(
          (
            hue / 60
          ) %
            2 -
            1
        )
      );

    const m =
      l - chroma / 2;

    let r = 0;
    let g = 0;
    let b = 0;

    if (hue < 60) {
      r = chroma;
      g = x;
    } else if (hue < 120) {
      r = x;
      g = chroma;
    } else if (hue < 180) {
      g = chroma;
      b = x;
    } else if (hue < 240) {
      g = x;
      b = chroma;
    } else if (hue < 300) {
      r = x;
      b = chroma;
    } else {
      r = chroma;
      b = x;
    }

    const channel = (
      value: number
    ): string =>
      Math.round(
        (
          value + m
        ) * 255
      )
        .toString(16)
        .padStart(
          2,
          '0'
        );

    return (
      '#' +
      channel(r) +
      channel(g) +
      channel(b)
    );
  }


  private async localizarCidade(
    cidade: string,
    estado: string
  ): Promise<void> {

    if (
      !this.map ||
      !cidade ||
      !estado
    ) {
      return;
    }

    const mapa = this.map;
    const fazendaId = this.loadedFazendaId;
    const termo =
      `${cidade}, ${estado}, Brasil`;

    try {

      const url =
        'https://api.mapbox.com/search/geocode/v6/forward' +
        `?q=${encodeURIComponent(termo)}` +
        '&country=br&language=pt&limit=1' +
        '&types=place,locality' +
        `&access_token=${encodeURIComponent(MAPBOX_ACCESS_TOKEN)}`;

      const response =
        await fetch(url);

      if (!response.ok) {
        return;
      }

      const data =
        await response.json();

      const coordinates =
        data?.features?.[0]
          ?.geometry
          ?.coordinates;

      if (
        !Array.isArray(coordinates) ||
        coordinates.length < 2
      ) {
        return;
      }

      if (this.map !== mapa || this.loadedFazendaId !== fazendaId) {
        return;
      }

      mapa.flyTo({
        center: [
          Number(coordinates[0]),
          Number(coordinates[1])
        ],
        zoom: 13,
        duration: 700
      });

    } catch {

      /*
       * Geocoding é apenas auxílio visual.
       * A falha não bloqueia o desenho.
       */
    }
  }


  private styleDefinition(
    modo: ModoMapa
  ): string | mapboxgl.StyleSpecification {

    if (modo === 'MAPA') {
      return 'mapbox://styles/mapbox/standard';
    }

    /*
     * O Mapbox permanece como renderer e para o mapa
     * vetorial/geocoding. A fotografia de satélite vem
     * do MapTiler para não depender do Raster Tiles API
     * do plano de avaliação do Mapbox.
     */
    return {
      version: 8,

      sources: {
        'agrovision-satellite': {
          type: 'raster',
          url:
            'https://api.maptiler.com/tiles/satellite-v2/tiles.json' +
            `?key=${encodeURIComponent(MAPTILER_API_KEY)}`,
          tileSize: 512,
          attribution:
            '© MapTiler'
        }
      },

      layers: [
        {
          id: 'agrovision-satellite',
          type: 'raster',
          source: 'agrovision-satellite',

          paint: {
            'raster-fade-duration': 0
          }
        }
      ]
    };
  }


  private calcularAreaHa(
    geometry: GeoJsonPolygon
  ): number {

    const raioTerra =
      6_378_137;

    const areaRing = (
      pontos: number[][]
    ): number => {

      if (pontos.length < 3) {
        return 0;
      }

      const ring =
        pontos.map(item => [
          item[0],
          item[1]
        ]);

      const primeira =
        ring[0];

      const ultima =
        ring[ring.length - 1];

      if (
        primeira[0] !== ultima[0] ||
        primeira[1] !== ultima[1]
      ) {
        ring.push([
          primeira[0],
          primeira[1]
        ]);
      }

      let soma = 0;

      for (
        let i = 0;
        i < ring.length - 1;
        i++
      ) {

        const atual =
          ring[i];

        const proximo =
          ring[i + 1];

        const lon1 =
          atual[0] *
          Math.PI /
          180;

        const lat1 =
          atual[1] *
          Math.PI /
          180;

        const lon2 =
          proximo[0] *
          Math.PI /
          180;

        const lat2 =
          proximo[1] *
          Math.PI /
          180;

        soma +=
          (lon2 - lon1) *
          (
            2 +
            Math.sin(lat1) +
            Math.sin(lat2)
          );
      }

      return (
        soma *
        raioTerra *
        raioTerra /
        2
      );
    };


    const rings =
      geometry.coordinates;

    if (rings.length === 0) {
      return 0;
    }

    let metrosQuadrados =
      Math.abs(
        areaRing(
          rings[0]
        )
      );

    for (
      let i = 1;
      i < rings.length;
      i++
    ) {

      metrosQuadrados -=
        Math.abs(
          areaRing(
            rings[i]
          )
        );
    }

    return Math.round(
      Math.max(
        0,
        metrosQuadrados /
          10_000
      ) *
      10_000
    ) / 10_000;
  }


  private extrairMensagemErro(
    error: any,
    fallback: string
  ): string {

    if (error?.error?.message) {
      return error.error.message;
    }

    if (
      typeof error?.error === 'string' &&
      error.error.trim()
    ) {
      return error.error;
    }

    if (error?.status === 0) {
      return 'Não foi possível conectar ao servidor.';
    }

    return fallback;
  }
}
