import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
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
  MAPBOX_ACCESS_TOKEN
} from '../../core/config/mapbox.config';

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


type ModoMapa =
  | 'SATELITE'
  | 'MAPA';

type ModoEdicao =
  | 'NAVEGAR'
  | 'DESENHAR'
  | 'EDITAR';


@Component({
  selector: 'app-geopoligono-fazenda',
  standalone: true,

  imports: [
    DecimalPipe,
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


  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly fazendaService =
    inject(FazendaService);

  private readonly geopoligonoService =
    inject(FazendaGeopoligonoService);

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

  readonly mapaPronto =
    signal(false);

  readonly modoMapa =
    signal<ModoMapa>('SATELITE');

  readonly modoEdicao =
    signal<ModoEdicao>('NAVEGAR');

  readonly buscaLocal =
    signal('');


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

    try {
      this.draw?.stop();
    } catch {
      // O mapa pode ter sido destruído antes do Terra Draw.
    }

    this.draw = null;

    this.map?.remove();
    this.map = null;
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
      !this.featureId
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


  alterarMapa(
    modo: ModoMapa
  ): void {

    this.modoMapa.set(
      modo
    );

    if (!this.map) {
      return;
    }

    const geometry =
      this.geometriaAtual();

    try {
      this.draw?.stop();
    } catch {
      // A troca de estilo recria as camadas do Terra Draw.
    }

    this.draw = null;
    this.featureId = null;
    this.mapaPronto.set(false);

    this.map.setStyle(
      this.styleDefinition(modo)
    );

    this.map.once(
      'style.load',
      () => {

        this.inicializarTerraDraw();

        if (geometry) {
          this.geometriaAtual.set(
            geometry
          );
        }

        this.mapaPronto.set(true);

        this.aplicarDadosNoMapa();
      }
    );
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
        projection: 'mercator'
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


    this.map.on(
      'load',
      () => {

        this.mapLoaded = true;

        this.mapaPronto.set(
          true
        );

        this.inicializarTerraDraw();

        this.aplicarDadosNoMapa();
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

                return ValidateNotSelfIntersecting(
                  feature
                );
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
                  draggable: true,
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

          this.modoEdicao.set(
            'NAVEGAR'
          );

          this.draw?.setMode(
            'select'
          );
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

      this.map.flyTo({
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
     * Satélite direto pelo tileset raster.
     *
     * Evita depender do style clássico satellite-v9
     * e entrega a imagem fotográfica pura que o
     * produtor precisa para visualizar pastos,
     * cercas, carreadores e divisas.
     */
    return {
      version: 8,

      sources: {
        'agrovision-satellite': {
          type: 'raster',
          url: 'mapbox://mapbox.satellite',
          tileSize: 256
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
