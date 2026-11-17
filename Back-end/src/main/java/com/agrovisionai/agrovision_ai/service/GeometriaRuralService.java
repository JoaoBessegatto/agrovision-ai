package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.domain.dto.request.GeoJsonPolygonDTO;
import com.agrovisionai.agrovision_ai.exception.BusinessException;
import org.locationtech.jts.geom.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class GeometriaRuralService {

    private static final int SRID_WGS84 = 4326;
    private static final double RAIO_TERRA_METROS = 6_378_137.0;

    private final GeometryFactory geometryFactory =
            new GeometryFactory(
                    new PrecisionModel(),
                    SRID_WGS84
            );

    public Polygon converterParaPolygon(
            GeoJsonPolygonDTO geoJson,
            String nomeGeometria
    ) {

        if (
                geoJson == null ||
                !"POLYGON".equalsIgnoreCase(
                        geoJson.type()
                )
        ) {
            throw new BusinessException(
                    nomeGeometria +
                            " deve ser um Polygon GeoJSON."
            );
        }

        List<List<List<Double>>> rings =
                geoJson.coordinates();

        if (
                rings == null ||
                rings.isEmpty()
        ) {
            throw new BusinessException(
                    nomeGeometria +
                            " não possui coordenadas."
            );
        }

        LinearRing shell =
                criarAnel(
                        rings.get(0),
                        "limite externo"
                );

        LinearRing[] holes =
                new LinearRing[
                        Math.max(
                                0,
                                rings.size() - 1
                        )
                ];

        for (
                int i = 1;
                i < rings.size();
                i++
        ) {

            holes[i - 1] =
                    criarAnel(
                            rings.get(i),
                            "área interna " + i
                    );
        }

        Polygon polygon =
                geometryFactory
                        .createPolygon(
                                shell,
                                holes
                        );

        polygon.setSRID(
                SRID_WGS84
        );

        if (
                polygon.isEmpty() ||
                !polygon.isValid()
        ) {
            throw new BusinessException(
                    nomeGeometria +
                            " é inválido. Verifique cruzamentos entre as linhas."
            );
        }

        return polygon;
    }

    public GeoJsonPolygonDTO converterParaGeoJson(
            Polygon polygon
    ) {

        List<List<List<Double>>> rings =
                new ArrayList<>();

        rings.add(
                converterCoordenadas(
                        polygon
                                .getExteriorRing()
                                .getCoordinates()
                )
        );

        for (
                int i = 0;
                i < polygon.getNumInteriorRing();
                i++
        ) {

            rings.add(
                    converterCoordenadas(
                            polygon
                                    .getInteriorRingN(i)
                                    .getCoordinates()
                    )
            );
        }

        return new GeoJsonPolygonDTO(
                "Polygon",
                rings
        );
    }

    public double calcularAreaHa(
            GeoJsonPolygonDTO geoJson
    ) {

        List<List<List<Double>>> rings =
                geoJson.coordinates();

        double metrosQuadrados =
                Math.abs(
                        calcularAreaAnel(
                                rings.get(0)
                        )
                );

        for (
                int i = 1;
                i < rings.size();
                i++
        ) {

            metrosQuadrados -=
                    Math.abs(
                            calcularAreaAnel(
                                    rings.get(i)
                            )
                    );
        }

        return Math.max(
                0.0,
                metrosQuadrados / 10_000.0
        );
    }

    public boolean estaContido(
            Polygon limite,
            Polygon area
    ) {

        return limite.covers(
                area
        );
    }

    public boolean possuiSobreposicaoReal(
            Polygon primeira,
            Polygon segunda
    ) {

        if (
                primeira.disjoint(
                        segunda
                )
        ) {
            return false;
        }

        /*
         * Piquetes podem compartilhar somente a linha
         * de cerca. Encostar na borda não é sobreposição.
         */
        return !primeira.touches(
                segunda
        );
    }

    private LinearRing criarAnel(
            List<List<Double>> pontos,
            String descricao
    ) {

        if (
                pontos == null ||
                pontos.size() < 3
        ) {
            throw new BusinessException(
                    "O " + descricao +
                            " precisa ter pelo menos três pontos."
            );
        }

        List<Coordinate> coordinates =
                new ArrayList<>();

        for (List<Double> ponto : pontos) {

            if (
                    ponto == null ||
                    ponto.size() < 2 ||
                    ponto.get(0) == null ||
                    ponto.get(1) == null
            ) {
                throw new BusinessException(
                        "Uma das coordenadas está incompleta."
                );
            }

            double longitude =
                    ponto.get(0);

            double latitude =
                    ponto.get(1);

            if (
                    !Double.isFinite(longitude) ||
                    longitude < -180 ||
                    longitude > 180
            ) {
                throw new BusinessException(
                        "Longitude inválida."
                );
            }

            if (
                    !Double.isFinite(latitude) ||
                    latitude < -90 ||
                    latitude > 90
            ) {
                throw new BusinessException(
                        "Latitude inválida."
                );
            }

            coordinates.add(
                    new Coordinate(
                            longitude,
                            latitude
                    )
            );
        }

        Coordinate primeira =
                coordinates.get(0);

        Coordinate ultima =
                coordinates.get(
                        coordinates.size() - 1
                );

        if (
                !primeira.equals2D(
                        ultima
                )
        ) {

            coordinates.add(
                    new Coordinate(
                            primeira.x,
                            primeira.y
                    )
            );
        }

        if (coordinates.size() < 4) {
            throw new BusinessException(
                    "O polígono precisa possuir ao menos três vértices distintos."
            );
        }

        return geometryFactory
                .createLinearRing(
                        coordinates.toArray(
                                Coordinate[]::new
                        )
                );
    }

    private double calcularAreaAnel(
            List<List<Double>> pontos
    ) {

        if (
                pontos == null ||
                pontos.size() < 3
        ) {
            return 0.0;
        }

        List<List<Double>> ring =
                new ArrayList<>(
                        pontos
                );

        List<Double> primeira =
                ring.get(0);

        List<Double> ultima =
                ring.get(
                        ring.size() - 1
                );

        if (
                !mesmoPonto(
                        primeira,
                        ultima
                )
        ) {

            ring.add(
                    List.of(
                            primeira.get(0),
                            primeira.get(1)
                    )
            );
        }

        double soma = 0.0;

        for (
                int i = 0;
                i < ring.size() - 1;
                i++
        ) {

            List<Double> atual =
                    ring.get(i);

            List<Double> proximo =
                    ring.get(i + 1);

            double lon1 =
                    Math.toRadians(
                            atual.get(0)
                    );

            double lat1 =
                    Math.toRadians(
                            atual.get(1)
                    );

            double lon2 =
                    Math.toRadians(
                            proximo.get(0)
                    );

            double lat2 =
                    Math.toRadians(
                            proximo.get(1)
                    );

            soma +=
                    (lon2 - lon1) *
                            (
                                    2.0 +
                                    Math.sin(lat1) +
                                    Math.sin(lat2)
                            );
        }

        return soma *
                RAIO_TERRA_METROS *
                RAIO_TERRA_METROS /
                2.0;
    }

    private boolean mesmoPonto(
            List<Double> a,
            List<Double> b
    ) {

        return a != null &&
                b != null &&
                a.size() >= 2 &&
                b.size() >= 2 &&
                Double.compare(
                        a.get(0),
                        b.get(0)
                ) == 0 &&
                Double.compare(
                        a.get(1),
                        b.get(1)
                ) == 0;
    }

    private List<List<Double>> converterCoordenadas(
            Coordinate[] coordinates
    ) {

        List<List<Double>> resultado =
                new ArrayList<>();

        for (Coordinate coordinate : coordinates) {

            resultado.add(
                    List.of(
                            coordinate.x,
                            coordinate.y
                    )
            );
        }

        return resultado;
    }
}
