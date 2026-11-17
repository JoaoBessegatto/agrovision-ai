export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface FazendaGeopoligonoResponse {
  fazendaId: string;
  configurado: boolean;
  geometry: GeoJsonPolygon | null;
  areaCalculadaHa: number | null;
  areaInformadaHa: number | null;
  diferencaAreaHa: number | null;
  diferencaPercentual: number | null;
  centroideLatitude: number | null;
  centroideLongitude: number | null;
  atualizadoEm: string | null;
}

export interface FazendaGeopoligonoRequest {
  geometry: GeoJsonPolygon;
}
