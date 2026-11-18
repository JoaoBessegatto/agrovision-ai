import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { vi } from 'vitest';

import { GeopoligonoFazenda } from './geopoligono-fazenda';
import { AreaManejoService } from '../../core/area-manejo/services/area-manejo.service';
import { ResumoAreasManejo } from '../../core/area-manejo/models/area-manejo';
import { FazendaContextService } from '../../core/fazenda/services/fazenda-context.service';
import { FazendaGeopoligonoService } from '../../core/fazenda/services/fazenda-geopoligono.service';
import { FazendaService } from '../../core/fazenda/services/fazenda.service';
import { GeoJsonPolygon } from '../../core/fazenda/models/fazenda-geopoligono';
import { RebanhoService } from '../../core/rebanho/services/rebanho.service';

const limite: GeoJsonPolygon = {
  type: 'Polygon',
  coordinates: [[
    [-48, -20],
    [-47.99, -20],
    [-47.99, -19.99],
    [-48, -19.99],
    [-48, -20]
  ]]
};

const resumoVazio: ResumoAreasManejo = {
  fazendaId: 'fazenda-1',
  areaFazendaDelimitadaHa: 100,
  areaMapeadaHa: 0,
  areaLivreHa: 100,
  percentualAreaMapeada: 0,
  totalAreas: 0,
  totalPastos: 0,
  totalConfinamentos: 0,
  areaPastoHa: 0,
  areaConfinamentoHa: 0,
  rebanhosAssociados: 0,
  rebanhosSemArea: 0,
  animaisAtivosEmAreas: 0,
  areas: []
};

function criarMapa() {
  let fontesCarregadas = true;
  const sources = new Map<string, { data: unknown; setData: (data: unknown) => void }>();
  const layers = new Map<string, { id: string }>();
  const listeners = new Map<string, () => void>();

  return {
    sources,
    layers,
    listeners,
    isStyleLoaded: vi.fn(() => fontesCarregadas),
    atualizarFontes: () => { fontesCarregadas = false; },
    getSource: vi.fn((id: string) => sources.get(id)),
    addSource: vi.fn((id: string, source: { data: unknown }) => {
      sources.set(id, {
        data: source.data,
        setData(data: unknown) {
          this.data = data;
          fontesCarregadas = false;
        }
      });
    }),
    removeSource: vi.fn((id: string) => sources.delete(id)),
    getLayer: vi.fn((id: string) => layers.get(id)),
    addLayer: vi.fn((layer: { id: string }) => layers.set(layer.id, layer)),
    removeLayer: vi.fn((id: string) => layers.delete(id)),
    moveLayer: vi.fn(),
    setMinZoom: vi.fn(),
    setMaxBounds: vi.fn(),
    fitBounds: vi.fn(),
    once: vi.fn((event: string, listener: () => void) => listeners.set(event, listener)),
    setStyle: vi.fn(() => {
      sources.clear();
      layers.clear();
      fontesCarregadas = false;
    }),
    remove: vi.fn()
  };
}

describe('GeopoligonoFazenda: limite na gestão de piquetes', () => {
  let component: GeopoligonoFazenda;
  let mapa: ReturnType<typeof criarMapa>;
  let draw: {
    clear: ReturnType<typeof vi.fn>;
    setMode: ReturnType<typeof vi.fn>;
    addFeatures: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { data: {} } } },
        { provide: Router, useValue: {} },
        { provide: FazendaService, useValue: {} },
        { provide: FazendaGeopoligonoService, useValue: {} },
        { provide: AreaManejoService, useValue: {} },
        { provide: RebanhoService, useValue: {} },
        {
          provide: FazendaContextService,
          useValue: {
            fazendaAtivaId: signal(null),
            ehProprietario: signal(true)
          }
        }
      ]
    });

    component = TestBed.runInInjectionContext(() => new GeopoligonoFazenda());
    mapa = criarMapa();
    draw = {
      // O adaptador Terra Draw atualiza as fontes GeoJSON ao limpar o desenho.
      clear: vi.fn(() => mapa.atualizarFontes()),
      setMode: vi.fn(),
      addFeatures: vi.fn(() => [{ id: 'limite', valid: true }]),
      stop: vi.fn()
    };
    Object.assign(component, { map: mapa, draw, mapLoaded: true });
    component.geometriaAtual.set(limite);
    component.geopoligonoSalvo.set({
      fazendaId: 'fazenda-1',
      configurado: true,
      geometry: limite,
      areaCalculadaHa: 100,
      areaInformadaHa: 100,
      diferencaAreaHa: 0,
      diferencaPercentual: 0,
      centroideLatitude: -20,
      centroideLongitude: -48,
      atualizadoEm: null
    });
    component.modoMapa.set('SATELITE');
    component.sateliteConfigurado.set(true);
  });

  afterEach(() => component.ngOnDestroy());

  it.each([
    ['antes de carregar os piquetes', null],
    ['com uma lista de piquetes vazia', resumoVazio]
  ] as const)('mostra o limite %s, mesmo com fontes em processamento', (_, resumo) => {
    component.resumoAreas.set(resumo);

    component.abrirPiquetes();

    expect(draw.clear).toHaveBeenCalled();
    expect(mapa.isStyleLoaded()).toBe(false);
    expect(mapa.sources.get('geo-page-farm-boundary')?.data).toEqual({
      type: 'Feature', properties: {}, geometry: limite
    });
    expect(mapa.layers.has('geo-page-farm-line')).toBe(true);
    expect(mapa.layers.has('geo-page-farm-mask')).toBe(true);
    expect(mapa.setMaxBounds.mock.calls).toEqual([[null]]);
    expect(mapa.setMinZoom.mock.calls).toEqual([[0]]);
    expect(mapa.sources.get('geo-page-paddocks')?.data).toEqual({
      type: 'FeatureCollection', features: []
    });
    expect(mapa.moveLayer).toHaveBeenLastCalledWith('geo-page-farm-line');
    expect(component.geometriaAtual()).toEqual(limite);
  });

  it('remove as camadas de piquetes ao voltar ao limite com fontes em processamento', () => {
    component.abrirPiquetes();
    expect(mapa.layers.has('geo-page-farm-line')).toBe(true);

    component.abrirLimiteFazenda();

    expect(mapa.isStyleLoaded()).toBe(false);
    expect(mapa.layers.size).toBe(0);
    expect(mapa.sources.size).toBe(0);
    expect(draw.addFeatures).toHaveBeenCalledWith([
      { type: 'Feature', properties: { mode: 'polygon' }, geometry: limite }
    ]);
  });

  it('restaura o limite após carregar o estilo de satélite sem piquetes', () => {
    component.modoMapa.set('MAPA');
    component.resumoAreas.set(resumoVazio);
    // Isola a recriação do adaptador: o teste não precisa de canvas ou WebGL.
    vi.spyOn(component as unknown as { inicializarTerraDraw: () => void }, 'inicializarTerraDraw')
      .mockImplementation(() => Object.assign(component, { draw }));

    component.abrirPiquetes();

    expect(mapa.setStyle).toHaveBeenCalledOnce();
    expect(mapa.sources.has('geo-page-farm-boundary')).toBe(false);
    const estiloCarregado = mapa.listeners.get('style.load');
    expect(estiloCarregado).toBeDefined();
    estiloCarregado!();

    expect(mapa.isStyleLoaded()).toBe(false);
    expect(mapa.sources.get('geo-page-farm-boundary')?.data).toEqual({
      type: 'Feature', properties: {}, geometry: limite
    });
    expect(mapa.layers.has('geo-page-farm-line')).toBe(true);
    expect(component.mapaPronto()).toBe(true);
    expect(mapa.layers.has('geo-page-farm-mask')).toBe(true);
    expect(mapa.setMaxBounds.mock.calls).toEqual([[null]]);
    expect(mapa.setMinZoom.mock.calls).toEqual([[0]]);
  });
});
