import mapboxgl from 'mapbox-gl';

/** Mantém o worker distribuído pelo Mapbox fora da transformação do Angular. */
export function configureMapboxWorker(): void {
  mapboxgl.workerClass = class extends Worker {
    constructor() {
      super(new URL('assets/mapbox/mapbox-gl-csp-worker.js', document.baseURI));
    }
  };
}
