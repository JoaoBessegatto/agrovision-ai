import {
  Component,
  ElementRef,
  OnDestroy,
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
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  RouterLink
} from '@angular/router';

import {
  MatIconModule
} from '@angular/material/icon';

import {
  finalize,
  forkJoin
} from 'rxjs';

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
  MAPTILER_API_KEY
} from '../../core/config/maptiler.config';

import {
  FazendaContextService
} from '../../core/fazenda/services/fazenda-context.service';

import {
  FazendaGeopoligonoService
} from '../../core/fazenda/services/fazenda-geopoligono.service';

import {
  FazendaGeopoligonoResponse,
  GeoJsonPolygon
} from '../../core/fazenda/models/fazenda-geopoligono';

import {
  RebanhoService
} from '../../core/rebanho/services/rebanho.service';

import {
  RebanhoResponse
} from '../../core/rebanho/models/rebanho-response';

import {
  AreaManejoService
} from '../../core/area-manejo/services/area-manejo.service';

import {
  AreaManejo,
  AreaManejoRequest,
  ResumoAreasManejo,
  TipoAreaManejo
} from '../../core/area-manejo/models/area-manejo';


type ModoEditor =
  | 'NAVEGAR'
  | 'DESENHAR'
  | 'EDITAR';


@Component({
  selector: 'app-areas-manejo',
  standalone: true,

  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    RouterLink,
    MatIconModule
  ],

  templateUrl: './areas-manejo.html',
  styleUrl: './areas-manejo.scss'
})
export class AreasManejo
  implements OnDestroy {

  private mapContainer?:
    ElementRef<HTMLDivElement>;


  @ViewChild(
    'mapContainer'
  )
  set mapContainerRef(
    ref: ElementRef<HTMLDivElement> | undefined
  ) {

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


  private readonly formBuilder =
    inject(FormBuilder);

  private readonly geopoligonoService =
    inject(FazendaGeopoligonoService);

  private readonly areaManejoService =
    inject(AreaManejoService);

  private readonly rebanhoService =
    inject(RebanhoService);


  readonly fazendaContext =
    inject(FazendaContextService);


  readonly limiteFazenda =
    signal<FazendaGeopoligonoResponse | null>(
      null
    );

  readonly resumo =
    signal<ResumoAreasManejo | null>(
      null
    );

  readonly rebanhos =
    signal<RebanhoResponse[]>([]);

  readonly areaSelecionada =
    signal<AreaManejo | null>(
      null
    );

  readonly geometriaRascunho =
    signal<GeoJsonPolygon | null>(
      null
    );

  readonly areaPreviewHa =
    signal<number | null>(
      null
    );

  readonly loading =
    signal(false);

  readonly saving =
    signal(false);

  readonly deleting =
    signal(false);

  readonly errorMessage =
    signal('');

  readonly successMessage =
    signal('');

  readonly modoEditor =
    signal<ModoEditor>('NAVEGAR');

  readonly mapaPronto =
    signal(false);

  readonly mapaConfigurado =
    signal(
      MAPTILER_API_KEY
        .trim()
        .length > 0
    );

  readonly rebanhosDisponiveis =
    computed(() => {

      const selecionada =
        this.areaSelecionada();

      const ocupados =
        new Set(
          (
            this.resumo()
              ?.areas ?? []
          )
            .filter(area =>
              area.id !==
                selecionada?.id &&
              area.rebanhoId
            )
            .map(area =>
              area.rebanhoId as string
            )
        );

      return this.rebanhos()
        .filter(rebanho =>
          !ocupados.has(
            rebanho.id
          )
        );
    });


  readonly form =
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

  private featureId:
    string | number | null = null;

  private loadedFazendaId:
    string | null = null;

  private sincronizandoMapa =
    false;

  private ultimaGeometriaValida:
    GeoJsonPolygon | null = null;

  private readonly toleranciaSnapPx =
    8;


  constructor() {

    effect(() => {

      const fazendaId =
        this.fazendaContext
          .fazendaAtivaId();

      if (
        fazendaId &&
        fazendaId !==
          this.loadedFazendaId
      ) {

        this.carregar(
          fazendaId
        );
      }
    });
  }


  ngOnDestroy(): void {

    try {
      this.draw?.stop();
    } catch {
      // O mapa pode já ter sido destruído.
    }

    this.draw = null;

    this.map?.remove();
    this.map = null;
  }


  tipoAtual(): TipoAreaManejo {

    return (
      this.form.controls.tipo.value ??
      'PASTO'
    ) as TipoAreaManejo;
  }


  alterarTipo(): void {

    if (
      this.tipoAtual() ===
      'PASTO'
    ) {

      this.form.controls
        .capacidadeMaximaCabecas
        .setValue(null);
    }
  }


  iniciarNovaArea(): void {

    if (
      !this.fazendaContext.ehProprietario() ||
      !this.draw
    ) {
      return;
    }

    this.limparMensagens();

    this.areaSelecionada.set(
      null
    );

    this.form.reset({
      nome: '',
      descricao: '',
      tipo: 'PASTO',
      capacidadeMaximaCabecas: null,
      rebanhoId: ''
    });

    this.sincronizandoMapa =
      true;

    this.draw.clear();

    this.sincronizandoMapa =
      false;

    this.featureId = null;

    this.geometriaRascunho.set(
      null
    );

    this.areaPreviewHa.set(
      null
    );

    this.ultimaGeometriaValida =
      null;

    this.modoEditor.set(
      'DESENHAR'
    );

    this.draw.setMode(
      'polygon'
    );

    this.renderizarAreasSalvas();
    this.enquadrarFazenda();
  }


  selecionarArea(
    area: AreaManejo
  ): void {

    if (
      this.modoEditor() !==
      'NAVEGAR'
    ) {
      return;
    }

    this.areaSelecionada.set(
      area
    );

    this.renderizarAreasSalvas();

    this.enquadrarPoligono(
      area.geometry,
      16
    );
  }


  editarArea(
    area: AreaManejo
  ): void {

    if (
      !this.fazendaContext.ehProprietario() ||
      !this.draw
    ) {
      return;
    }

    this.limparMensagens();

    this.areaSelecionada.set(
      area
    );

    this.form.reset({
      nome: area.nome,
      descricao:
        area.descricao ?? '',
      tipo: area.tipo,
      capacidadeMaximaCabecas:
        area.indicadores
          .capacidadeMaximaCabecas,
      rebanhoId:
        area.rebanhoId ?? ''
    });

    this.geometriaRascunho.set(
      area.geometry
    );

    this.areaPreviewHa.set(
      area.areaCalculadaHa
    );

    this.ultimaGeometriaValida =
      this.clonarGeometria(
        area.geometry
      );

    this.modoEditor.set(
      'EDITAR'
    );

    this.renderizarAreasSalvas();

    this.carregarAreaNoEditor(
      area.geometry
    );
  }


  cancelarEdicao(): void {

    this.limparMensagens();

    this.sincronizandoMapa =
      true;

    this.draw?.clear();

    this.sincronizandoMapa =
      false;

    this.featureId = null;

    this.geometriaRascunho.set(
      null
    );

    this.areaPreviewHa.set(
      null
    );

    this.ultimaGeometriaValida =
      null;

    this.modoEditor.set(
      'NAVEGAR'
    );

    this.form.reset({
      nome: '',
      descricao: '',
      tipo: 'PASTO',
      capacidadeMaximaCabecas: null,
      rebanhoId: ''
    });

    this.renderizarAreasSalvas();
  }


  editarPontos(): void {

    if (
      !this.draw ||
      this.featureId === null
    ) {
      return;
    }

    this.draw.setMode(
      'select'
    );

    this.draw.selectFeature(
      this.featureId as string
    );
  }


  refazerDesenho(): void {

    if (!this.draw) {
      return;
    }

    this.sincronizandoMapa =
      true;

    this.draw.clear();

    this.sincronizandoMapa =
      false;

    this.featureId = null;

    this.geometriaRascunho.set(
      null
    );

    this.areaPreviewHa.set(
      null
    );

    this.ultimaGeometriaValida =
      null;

    this.modoEditor.set(
      'DESENHAR'
    );

    this.draw.setMode(
      'polygon'
    );
  }


  salvar(): void {

    const fazendaId =
      this.loadedFazendaId;

    const geometry =
      this.geometriaRascunho();

    if (
      !fazendaId ||
      !geometry ||
      this.form.invalid ||
      !this.fazendaContext.ehProprietario()
    ) {

      this.form.markAllAsTouched();

      if (!geometry) {

        this.errorMessage.set(
          'Desenhe a área no mapa antes de salvar.'
        );
      }

      return;
    }

    const raw =
      this.form.getRawValue();

    const descricao =
      raw.descricao?.trim() ?? '';

    const request:
      AreaManejoRequest = {

        nome:
          raw.nome?.trim() ?? '',

        descricao:
          descricao
            ? descricao
            : null,

        tipo:
          (
            raw.tipo ??
            'PASTO'
          ) as TipoAreaManejo,

        geometry,

        capacidadeMaximaCabecas:
          raw.tipo === 'CONFINAMENTO'
            ? raw.capacidadeMaximaCabecas
            : null,

        rebanhoId:
          raw.rebanhoId
            ? raw.rebanhoId
            : null
      };


    this.saving.set(
      true
    );

    this.limparMensagens();

    const selecionada =
      this.areaSelecionada();

    const request$ =
      selecionada &&
      this.modoEditor() ===
        'EDITAR'
        ? this.areaManejoService
            .atualizar(
              selecionada.id,
              request
            )
        : this.areaManejoService
            .cadastrar(
              fazendaId,
              request
            );


    request$
      .pipe(
        finalize(() =>
          this.saving.set(false)
        )
      )
      .subscribe({

        next: area => {

          this.successMessage.set(
            selecionada
              ? 'Área atualizada com sucesso.'
              : 'Área criada com sucesso.'
          );

          this.finalizarEdicao();

          this.recarregarAreas(
            area.id
          );
        },

        error: error => {

          this.errorMessage.set(
            this.extrairMensagemErro(
              error,
              'Não foi possível salvar a área.'
            )
          );
        }
      });
  }


  deletarArea(
    area: AreaManejo
  ): void {

    if (
      !this.fazendaContext.ehProprietario() ||
      this.deleting()
    ) {
      return;
    }

    const confirmou =
      window.confirm(
        `Excluir a área "${area.nome}"? O rebanho não será excluído.`
      );

    if (!confirmou) {
      return;
    }

    this.deleting.set(
      true
    );

    this.limparMensagens();

    this.areaManejoService
      .deletar(
        area.id
      )
      .pipe(
        finalize(() =>
          this.deleting.set(false)
        )
      )
      .subscribe({

        next: () => {

          if (
            this.areaSelecionada()
              ?.id === area.id
          ) {

            this.areaSelecionada.set(
              null
            );
          }

          this.successMessage.set(
            'Área excluída com sucesso.'
          );

          this.finalizarEdicao();

          this.recarregarAreas();
        },

        error: error => {

          this.errorMessage.set(
            this.extrairMensagemErro(
              error,
              'Não foi possível excluir a área.'
            )
          );
        }
      });
  }


  corArea(
    area: AreaManejo
  ): string {

    return this.corPorId(
      area.id
    );
  }


  labelTipo(
    tipo: TipoAreaManejo
  ): string {

    return tipo === 'PASTO'
      ? 'Pasto'
      : 'Confinamento';
  }


  labelStatusConfinamento(
    status: string | null
  ): string {

    switch (status) {

      case 'VAZIO':
        return 'Vazio';

      case 'DISPONIVEL':
        return 'Com vagas';

      case 'LOTADO':
        return 'Lotado';

      case 'ACIMA_CAPACIDADE':
        return 'Acima da capacidade';

      default:
        return 'Capacidade não informada';
    }
  }


  limparMensagens(): void {

    this.errorMessage.set('');
    this.successMessage.set('');
  }


  private carregar(
    fazendaId: string
  ): void {

    this.loadedFazendaId =
      fazendaId;

    this.areaSelecionada.set(
      null
    );

    this.resumo.set(
      null
    );

    this.loading.set(
      true
    );

    this.finalizarEdicao();
    this.limparMensagens();

    forkJoin({

      limite:
        this.geopoligonoService
          .buscar(
            fazendaId
          ),

      rebanhos:
        this.rebanhoService
          .listarPorFazenda(
            fazendaId
          )
    })
      .subscribe({

        next: base => {

          if (
            this.loadedFazendaId !==
            fazendaId
          ) {
            return;
          }

          this.limiteFazenda.set(
            base.limite
          );

          this.rebanhos.set(
            base.rebanhos
          );

          if (
            base.limite.configurado
          ) {

            /*
             * Libera a tela imediatamente com o limite
             * oficial da Fazenda. A listagem real de
             * piquetes chega logo depois e apenas atualiza
             * as camadas já existentes.
             */
            this.resumo.set(
              this.criarResumoInicial(
                fazendaId,
                base.limite
              )
            );

            this.loading.set(
              false
            );
          }

          if (
            !base.limite.configurado
          ) {

            this.resumo.set(
              null
            );

            this.loading.set(
              false
            );

            this.renderizarCamadas();

            return;
          }

          this.areaManejoService
            .listarResumo(
              fazendaId
            )
            .pipe(
              finalize(() =>
                this.loading.set(false)
              )
            )
            .subscribe({

              next: resumo => {

                if (
                  this.loadedFazendaId !==
                  fazendaId
                ) {
                  return;
                }

                this.resumo.set(
                  resumo
                );

                this.renderizarCamadas();

                this.enquadrarFazenda();
              },

              error: error => {

                this.errorMessage.set(
                  this.extrairMensagemErro(
                    error,
                    'Não foi possível carregar as áreas de manejo.'
                  )
                );
              }
            });
        },

        error: error => {

          this.loading.set(
            false
          );

          this.errorMessage.set(
            this.extrairMensagemErro(
              error,
              'Não foi possível carregar os dados da fazenda.'
            )
          );
        }
      });
  }


  private recarregarAreas(
    selecionarId?: string
  ): void {

    const fazendaId =
      this.loadedFazendaId;

    if (!fazendaId) {
      return;
    }

    this.areaManejoService
      .listarResumo(
        fazendaId
      )
      .subscribe({

        next: resumo => {

          this.resumo.set(
            resumo
          );

          if (selecionarId) {

            const area =
              resumo.areas.find(
                item =>
                  item.id ===
                  selecionarId
              ) ?? null;

            this.areaSelecionada.set(
              area
            );
          }

          this.renderizarAreasSalvas();
        },

        error: error => {

          this.errorMessage.set(
            this.extrairMensagemErro(
              error,
              'Não foi possível atualizar as áreas.'
            )
          );
        }
      });
  }


  private finalizarEdicao(): void {

    this.sincronizandoMapa =
      true;

    this.draw?.clear();

    this.sincronizandoMapa =
      false;

    this.featureId = null;

    this.geometriaRascunho.set(
      null
    );

    this.areaPreviewHa.set(
      null
    );

    this.ultimaGeometriaValida =
      null;

    this.modoEditor.set(
      'NAVEGAR'
    );

    this.form.reset({
      nome: '',
      descricao: '',
      tipo: 'PASTO',
      capacidadeMaximaCabecas: null,
      rebanhoId: ''
    });

    this.renderizarAreasSalvas();
  }


  private inicializarMapa(): void {

    if (
      this.map ||
      !this.mapContainer
    ) {
      return;
    }

    this.map =
      new mapboxgl.Map({

        container:
          this.mapContainer
            .nativeElement,

        style:
          this.styleDefinition(),

        center: [
          -51.9253,
          -14.235
        ],

        zoom: 4,

        bearing: 0,
        pitch: 0,
        minPitch: 0,
        maxPitch: 0,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        projection: 'mercator'
      });


    this.map.addControl(
      new mapboxgl.NavigationControl({
        showCompass: false,
        showZoom: true
      }),
      'top-right'
    );

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

        this.mapaPronto.set(
          true
        );

        this.inicializarTerraDraw();

        this.renderizarCamadas();

        this.enquadrarFazenda();
      }
    );


    this.map.on(
      'click',
      event => {

        if (
          this.modoEditor() !==
            'NAVEGAR' ||
          !this.map ||
          !this.map.getLayer(
            'areas-manejo-fill'
          )
        ) {
          return;
        }

        const features =
          this.map
            .queryRenderedFeatures(
              event.point,
              {
                layers: [
                  'areas-manejo-fill'
                ]
              }
            );

        const feature =
          features[0] as {
            properties?: Record<string, unknown>
          } | undefined;

        const id =
          feature?.properties?.['id'];

        if (!id) {
          return;
        }

        const area =
          this.resumo()
            ?.areas
            .find(item =>
              item.id === id
            );

        if (area) {
          this.selecionarArea(
            area
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
                  feature.geometry.type ===
                    'Polygon' &&
                  !this.geometriaPermitidaNoLimite(
                    {
                      type: 'Polygon',
                      coordinates:
                        feature.geometry
                          .coordinates as number[][][]
                    }
                  )
                ) {

                  return {
                    valid: false
                  };
                }
              }

              return {
                valid: true
              };
            },

            styles: {
              fillColor: '#e2a82e',
              fillOpacity: 0.28,
              outlineColor: '#ffffff',
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
                0.3,
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

        if (
          this.sincronizandoMapa
        ) {
          return;
        }

        this.sincronizarRascunho();
      }
    );


    this.draw.on(
      'finish',
      (_id, context) => {

        this.sincronizarRascunho();

        if (
          context.action === 'draw'
        ) {

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
        }
      }
    );
  }


  private carregarAreaNoEditor(
    geometry: GeoJsonPolygon
  ): void {

    if (!this.draw) {
      return;
    }

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
          geometry
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
    }

    this.enquadrarPoligono(
      geometry,
      17
    );
  }


  private sincronizarRascunho(): void {

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

      this.geometriaRascunho.set(
        null
      );

      this.areaPreviewHa.set(
        null
      );

      return;
    }

    const geometryOriginal:
      GeoJsonPolygon = {

        type: 'Polygon',

        coordinates:
          feature.geometry
            .coordinates as number[][][]
      };

    const normalizada =
      this.normalizarGeometriaAoLimite(
        geometryOriginal
      );

    if (!normalizada.valida) {

      /*
       * Edição fora da propriedade: volta para o
       * último estado válido. Dessa forma o usuário
       * não consegue arrastar um vértice para fora.
       */
      if (
        this.ultimaGeometriaValida &&
        feature.id !== undefined
      ) {

        this.sincronizandoMapa =
          true;

        try {

          this.draw
            .updateFeatureGeometry(
              feature.id,
              this.clonarGeometria(
                this.ultimaGeometriaValida
              )
            );

        } finally {

          this.sincronizandoMapa =
            false;
        }

        this.geometriaRascunho.set(
          this.clonarGeometria(
            this.ultimaGeometriaValida
          )
        );

        this.areaPreviewHa.set(
          this.calcularAreaHa(
            this.ultimaGeometriaValida
          )
        );
      }

      return;
    }

    if (
      normalizada.ajustada &&
      feature.id !== undefined
    ) {

      /*
       * Se o vértice caiu poucos pixels para fora
       * ou muito próximo da cerca, ele é encaixado
       * exatamente na linha oficial da Fazenda.
       */
      this.sincronizandoMapa =
        true;

      try {

        this.draw
          .updateFeatureGeometry(
            feature.id,
            normalizada.geometry
          );

      } finally {

        this.sincronizandoMapa =
          false;
      }
    }

    this.featureId =
      feature.id as string;

    this.ultimaGeometriaValida =
      this.clonarGeometria(
        normalizada.geometry
      );

    this.geometriaRascunho.set(
      this.clonarGeometria(
        normalizada.geometry
      )
    );

    this.areaPreviewHa.set(
      this.calcularAreaHa(
        normalizada.geometry
      )
    );
  }

  private renderizarCamadas(): void {

    if (
      !this.map ||
      !this.map.isStyleLoaded()
    ) {
      return;
    }

    this.renderizarFocoFazenda();
    this.renderizarAreasSalvas();
    this.renderizarLimiteFazenda();
    this.limitarNavegacaoNaFazenda();
  }


  private renderizarLimiteFazenda(): void {

    if (!this.map) {
      return;
    }

    const geometry =
      this.limiteFazenda()
        ?.geometry;

    if (!geometry) {
      return;
    }

    const data = {
      type: 'Feature',
      properties: {},
      geometry
    } as any;

    const source =
      this.map.getSource(
        'fazenda-boundary'
      ) as mapboxgl.GeoJSONSource | undefined;

    if (source) {

      source.setData(
        data
      );

      return;
    }

    this.map.addSource(
      'fazenda-boundary',
      {
        type: 'geojson',
        data
      }
    );

    this.map.addLayer({
      id: 'fazenda-boundary-fill',
      type: 'fill',
      source: 'fazenda-boundary',
      paint: {
        'fill-color': '#f5c842',
        'fill-opacity': 0.12
      }
    });

    this.map.addLayer({
      id: 'fazenda-boundary-line',
      type: 'line',
      source: 'fazenda-boundary',
      paint: {
        'line-color': '#ffd54a',
        'line-width': 4.5
      }
    });
  }


  private renderizarAreasSalvas(): void {

    if (
      !this.map ||
      !this.map.isStyleLoaded()
    ) {
      return;
    }

    const areaEditadaId =
      this.modoEditor() ===
        'EDITAR'
        ? this.areaSelecionada()
            ?.id
        : null;

    const features =
      (
        this.resumo()
          ?.areas ?? []
      )
        .filter(area =>
          area.id !==
            areaEditadaId
        )
        .map(area => ({
          type: 'Feature',
          properties: {
            id: area.id,
            nome: area.nome,
            tipo: area.tipo,
            cor:
              this.corArea(
                area
              ),
            selecionada:
              area.id ===
              this.areaSelecionada()
                ?.id
                ? 1
                : 0
          },
          geometry:
            area.geometry
        }));

    const data = {
      type: 'FeatureCollection',
      features
    } as any;

    const source =
      this.map.getSource(
        'areas-manejo'
      ) as mapboxgl.GeoJSONSource | undefined;

    if (source) {

      source.setData(
        data
      );

      return;
    }

    this.map.addSource(
      'areas-manejo',
      {
        type: 'geojson',
        data
      }
    );

    this.map.addLayer({
      id: 'areas-manejo-fill',
      type: 'fill',
      source: 'areas-manejo',

      paint: {
        'fill-color': [
          'get',
          'cor'
        ],

        'fill-opacity': [
          'case',
          [
            '==',
            ['get', 'selecionada'],
            1
          ],
          0.58,
          0.38
        ]
      }
    });

    this.map.addLayer({
      id: 'areas-manejo-line',
      type: 'line',
      source: 'areas-manejo',

      paint: {
        'line-color': [
          'case',
          [
            '==',
            ['get', 'selecionada'],
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
            ['get', 'selecionada'],
            1
          ],
          4.5,
          2.5
        ]
      }
    });
  }


  private enquadrarFazenda(): void {

    const geometry =
      this.limiteFazenda()
        ?.geometry;

    if (
      !geometry ||
      !this.map
    ) {
      return;
    }

    const bounds =
      this.obterBounds(
        geometry
      );

    /*
     * O mapa de piquetes é operacional, não um
     * mapa de navegação geral. O usuário consegue
     * trabalhar dentro da propriedade e em uma
     * pequena margem ao redor dela, sem se perder
     * em outras regiões.
     */
    const margem =
      this.expandirBounds(
        bounds,
        0.02
      );

    this.map.setMinZoom(0);

    const camera =
      this.map.cameraForBounds(
        bounds,
        {
          padding: 36,
          maxZoom: 19
        }
      );

    if (
      camera?.zoom !== undefined
    ) {

      this.map.setMinZoom(
        Math.max(
          0,
          camera.zoom - 0.08
        )
      );
    }

    this.map.setMaxBounds(
      margem
    );

    this.map.fitBounds(
      bounds,
      {
        padding: 36,
        maxZoom: 19,
        duration: 650
      }
    );
  }

  private enquadrarPoligono(
    geometry: GeoJsonPolygon,
    maxZoom: number
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

    ring.forEach(point => {

      bounds.extend([
        point[0],
        point[1]
      ]);
    });

    this.map.fitBounds(
      bounds,
      {
        padding: 55,
        maxZoom,
        duration: 650
      }
    );
  }


  private styleDefinition():
    mapboxgl.StyleSpecification {

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


  private renderizarFocoFazenda(): void {

    if (!this.map) {
      return;
    }

    const geometry =
      this.limiteFazenda()
        ?.geometry;

    const ring =
      geometry?.coordinates?.[0];

    if (
      !ring ||
      ring.length < 4
    ) {
      return;
    }

    /*
     * Máscara visual: a imagem de satélite continua
     * existindo, mas tudo que está fora da propriedade
     * fica escurecido. O interior da Fazenda permanece
     * totalmente legível para desenhar os piquetes.
     */
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
        'farm-focus-mask'
      ) as mapboxgl.GeoJSONSource | undefined;

    if (source) {

      source.setData(
        data
      );

      return;
    }

    this.map.addSource(
      'farm-focus-mask',
      {
        type: 'geojson',
        data
      }
    );

    this.map.addLayer({
      id: 'farm-focus-mask',
      type: 'fill',
      source: 'farm-focus-mask',

      paint: {
        'fill-color': '#07110a',
        'fill-opacity': 0.93
      }
    });
  }


  private limitarNavegacaoNaFazenda(): void {

    const geometry =
      this.limiteFazenda()
        ?.geometry;

    if (
      !geometry ||
      !this.map
    ) {
      return;
    }

    const bounds =
      this.obterBounds(
        geometry
      );

    this.map.setMaxBounds(
      this.expandirBounds(
        bounds,
        0.02
      )
    );
  }


  private obterBounds(
    geometry: GeoJsonPolygon
  ): mapboxgl.LngLatBounds {

    const bounds =
      new mapboxgl.LngLatBounds();

    geometry.coordinates
      .flat()
      .forEach(point => {

        bounds.extend([
          point[0],
          point[1]
        ]);
      });

    return bounds;
  }


  private expandirBounds(
    bounds: mapboxgl.LngLatBounds,
    percentual: number
  ): mapboxgl.LngLatBoundsLike {

    const west =
      bounds.getWest();

    const east =
      bounds.getEast();

    const south =
      bounds.getSouth();

    const north =
      bounds.getNorth();

    const longitudeMargin =
      Math.max(
        (east - west) * percentual,
        0.0005
      );

    const latitudeMargin =
      Math.max(
        (north - south) * percentual,
        0.0005
      );

    return [
      [
        west - longitudeMargin,
        south - latitudeMargin
      ],
      [
        east + longitudeMargin,
        north + latitudeMargin
      ]
    ];
  }


  private criarResumoInicial(
    fazendaId: string,
    limite: FazendaGeopoligonoResponse
  ): ResumoAreasManejo {

    return {
      fazendaId,
      areaFazendaDelimitadaHa:
        limite.areaCalculadaHa ?? 0,
      areaMapeadaHa: 0,
      areaLivreHa:
        limite.areaCalculadaHa ?? 0,
      percentualAreaMapeada: 0,
      totalAreas: 0,
      totalPastos: 0,
      totalConfinamentos: 0,
      areaPastoHa: 0,
      areaConfinamentoHa: 0,
      rebanhosAssociados: 0,
      rebanhosSemArea:
        this.rebanhos().length,
      animaisAtivosEmAreas: 0,
      areas: []
    };
  }


  private geometriaPermitidaNoLimite(
    geometry: GeoJsonPolygon
  ): boolean {

    return this
      .normalizarGeometriaAoLimite(
        geometry
      )
      .valida;
  }


  private normalizarGeometriaAoLimite(
    geometry: GeoJsonPolygon
  ): {
    geometry: GeoJsonPolygon;
    ajustada: boolean;
    valida: boolean;
  } {

    const limite =
      this.limiteFazenda()
        ?.geometry;

    if (!limite) {

      return {
        geometry,
        ajustada: false,
        valida: false
      };
    }

    let ajustada = false;
    let valida = true;

    const rings =
      geometry.coordinates
        .map(ring => {

          if (ring.length === 0) {
            return ring;
          }

          const fechada =
            this.mesmoPonto(
              ring[0],
              ring[
                ring.length - 1
              ]
            );

          const pontos =
            fechada
              ? ring.slice(0, -1)
              : [...ring];

          const normalizados =
            pontos.map(point => {

              const normalizado =
                this.normalizarPontoAoLimite(
                  point,
                  limite
                );

              if (!normalizado.valido) {
                valida = false;
              }

              if (normalizado.ajustado) {
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

    const resultado:
      GeoJsonPolygon = {

        type: 'Polygon',
        coordinates: rings
      };

    if (
      valida &&
      !this.segmentosDentroDoLimite(
        resultado,
        limite
      )
    ) {

      valida = false;
    }

    return {
      geometry: resultado,
      ajustada,
      valida
    };
  }


  private normalizarPontoAoLimite(
    point: number[],
    limite: GeoJsonPolygon
  ): {
    ponto: number[];
    ajustado: boolean;
    valido: boolean;
  } {

    if (
      point.length < 2 ||
      !Number.isFinite(point[0]) ||
      !Number.isFinite(point[1])
    ) {

      return {
        ponto: point,
        ajustado: false,
        valido: false
      };
    }

    const maisProximo =
      this.pontoMaisProximoNoLimite(
        point,
        limite
      );

    const distanciaPx =
      maisProximo
        ? this.distanciaPixels(
            point,
            maisProximo
          )
        : Number.POSITIVE_INFINITY;

    const dentro =
      this.pontoDentroPoligono(
        point,
        limite
      );

    /*
     * Também encaixa pontos que estão por dentro,
     * porém visualmente muito próximos da cerca.
     * Isso facilita dividir piquetes usando a própria
     * divisa oficial como lado do novo polígono.
     */
    if (
      maisProximo &&
      distanciaPx <=
        this.toleranciaSnapPx
    ) {

      return {
        ponto: maisProximo,
        ajustado:
          !this.mesmoPonto(
            point,
            maisProximo
          ),
        valido: true
      };
    }

    return {
      ponto: [
        point[0],
        point[1]
      ],
      ajustado: false,
      valido: dentro
    };
  }


  private segmentosDentroDoLimite(
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
         * Vértices dentro não garantem que a linha
         * inteira esteja dentro quando a Fazenda tem
         * formato côncavo. Amostramos o segmento para
         * bloquear esse atalho visual; o backend JTS
         * continua sendo a validação geométrica final.
         */
        for (
          let passo = 1;
          passo < 16;
          passo++
        ) {

          const t =
            passo / 16;

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
            !this.pontoDentroPoligono(
              ponto,
              limite
            )
          ) {

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
                this.toleranciaSnapPx
            ) {

              return false;
            }
          }
        }
      }
    }

    return true;
  }


  private pontoDentroPoligono(
    point: number[],
    polygon: GeoJsonPolygon
  ): boolean {

    const rings =
      polygon.coordinates;

    if (
      rings.length === 0 ||
      !this.pontoDentroOuNaBordaDoAnel(
        point,
        rings[0]
      )
    ) {
      return false;
    }

    for (
      let i = 1;
      i < rings.length;
      i++
    ) {

      if (
        this.pontoDentroAnel(
          point,
          rings[i]
        ) &&
        !this.pontoNaBordaDoAnel(
          point,
          rings[i]
        )
      ) {
        return false;
      }
    }

    return true;
  }


  private pontoDentroOuNaBordaDoAnel(
    point: number[],
    ring: number[][]
  ): boolean {

    return (
      this.pontoNaBordaDoAnel(
        point,
        ring
      ) ||
      this.pontoDentroAnel(
        point,
        ring
      )
    );
  }


  private pontoDentroAnel(
    point: number[],
    ring: number[][]
  ): boolean {

    if (ring.length < 3) {
      return false;
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


  private pontoNaBordaDoAnel(
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

      if (cross > tolerancia) {
        continue;
      }

      const dot =
        apX * abX +
        apY * abY;

      if (dot < -tolerancia) {
        continue;
      }

      const lengthSquared =
        abX * abX +
        abY * abY;

      if (
        dot -
          lengthSquared >
        tolerancia
      ) {
        continue;
      }

      return true;
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


  private clonarGeometria(
    geometry: GeoJsonPolygon
  ): GeoJsonPolygon {

    return {
      type: 'Polygon',
      coordinates:
        geometry.coordinates
          .map(ring =>
            ring.map(point => [
              point[0],
              point[1]
            ])
          )
    };
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

    /*
     * Evita tons amarelos próximos ao contorno
     * oficial da Fazenda, preservando a leitura
     * visual do limite principal.
     */
    if (
      hue >= 42 &&
      hue <= 70
    ) {
      hue =
        (hue + 75) % 360;
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

    const c =
      (
        1 -
        Math.abs(
          2 * l - 1
        )
      ) * s;

    const x =
      c *
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
      l - c / 2;

    let r = 0;
    let g = 0;
    let b = 0;

    if (hue < 60) {
      r = c;
      g = x;
    } else if (hue < 120) {
      r = x;
      g = c;
    } else if (hue < 180) {
      g = c;
      b = x;
    } else if (hue < 240) {
      g = x;
      b = c;
    } else if (hue < 300) {
      r = x;
      b = c;
    } else {
      r = c;
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
        ring[
          ring.length - 1
        ];

      if (
        primeira[0] !==
          ultima[0] ||
        primeira[1] !==
          ultima[1]
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
      typeof error?.error ===
        'string' &&
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
