package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.domain.dto.request.GeoJsonPolygonDTO;
import com.agrovisionai.agrovision_ai.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Polygon;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class GeometriaRuralServiceTest {

    private final GeometriaRuralService service =
            new GeometriaRuralService();

    @Test
    void deveCalcularAreaEmHectares() {

        GeoJsonPolygonDTO geoJson =
                polygon(
                        -50.0000, -21.0000,
                        -49.9900, -21.0000,
                        -49.9900, -20.9900,
                        -50.0000, -20.9900
                );

        double area =
                service.calcularAreaHa(
                        geoJson
                );

        assertTrue(
                area > 100.0
        );

        assertTrue(
                area < 130.0
        );
    }

    @Test
    void deveReconhecerAreaContidaNaFazenda() {

        Polygon fazenda =
                service.converterParaPolygon(
                        polygon(
                                -50.00, -21.00,
                                -49.90, -21.00,
                                -49.90, -20.90,
                                -50.00, -20.90
                        ),
                        "Fazenda"
                );

        Polygon piquete =
                service.converterParaPolygon(
                        polygon(
                                -49.98, -20.98,
                                -49.95, -20.98,
                                -49.95, -20.95,
                                -49.98, -20.95
                        ),
                        "Piquete"
                );

        assertTrue(
                service.estaContido(
                        fazenda,
                        piquete
                )
        );
    }

    @Test
    void deveRejeitarAreaParcialmenteForaDaFazenda() {

        Polygon fazenda =
                service.converterParaPolygon(
                        polygon(
                                -50.00, -21.00,
                                -49.90, -21.00,
                                -49.90, -20.90,
                                -50.00, -20.90
                        ),
                        "Fazenda"
                );

        Polygon piquete =
                service.converterParaPolygon(
                        polygon(
                                -49.95, -20.95,
                                -49.85, -20.95,
                                -49.85, -20.85,
                                -49.95, -20.85
                        ),
                        "Piquete"
                );

        assertFalse(
                service.estaContido(
                        fazenda,
                        piquete
                )
        );
    }

    @Test
    void deveAceitarPequenaDiferencaDePrecisaoNaBorda() {

        Polygon fazenda =
                service.converterParaPolygon(
                        polygon(
                                -50.00, -21.00,
                                -49.90, -21.00,
                                -49.90, -20.90,
                                -50.00, -20.90
                        ),
                        "Fazenda"
                );


        Polygon piquete =
                service.converterParaPolygon(
                        polygon(
                                -49.95, -20.98,
                                -49.899995, -20.98,
                                -49.899995, -20.95,
                                -49.95, -20.95
                        ),
                        "Piquete"
                );

        assertTrue(
                service.estaContido(
                        fazenda,
                        piquete
                )
        );
    }

    @Test
    void deveRejeitarAreaClaramenteForaMesmoComTolerancia() {

        Polygon fazenda =
                service.converterParaPolygon(
                        polygon(
                                -50.00, -21.00,
                                -49.90, -21.00,
                                -49.90, -20.90,
                                -50.00, -20.90
                        ),
                        "Fazenda"
                );

        Polygon piquete =
                service.converterParaPolygon(
                        polygon(
                                -49.95, -20.98,
                                -49.8998, -20.98,
                                -49.8998, -20.95,
                                -49.95, -20.95
                        ),
                        "Piquete"
                );

        assertFalse(
                service.estaContido(
                        fazenda,
                        piquete
                )
        );
    }


    @Test
    void devePermitirPiquetesQueApenasCompartilhamCerca() {

        Polygon primeiro =
                service.converterParaPolygon(
                        polygon(
                                -50.00, -21.00,
                                -49.95, -21.00,
                                -49.95, -20.95,
                                -50.00, -20.95
                        ),
                        "Primeiro"
                );

        Polygon segundo =
                service.converterParaPolygon(
                        polygon(
                                -49.95, -21.00,
                                -49.90, -21.00,
                                -49.90, -20.95,
                                -49.95, -20.95
                        ),
                        "Segundo"
                );

        assertFalse(
                service.possuiSobreposicaoReal(
                        primeiro,
                        segundo
                )
        );
    }

    @Test
    void deveDetectarSobreposicaoEntrePiquetes() {

        Polygon primeiro =
                service.converterParaPolygon(
                        polygon(
                                -50.00, -21.00,
                                -49.94, -21.00,
                                -49.94, -20.94,
                                -50.00, -20.94
                        ),
                        "Primeiro"
                );

        Polygon segundo =
                service.converterParaPolygon(
                        polygon(
                                -49.97, -20.97,
                                -49.91, -20.97,
                                -49.91, -20.91,
                                -49.97, -20.91
                        ),
                        "Segundo"
                );

        assertTrue(
                service.possuiSobreposicaoReal(
                        primeiro,
                        segundo
                )
        );
    }

    @Test
    void deveRejeitarPoligonoAutoIntersectante() {

        GeoJsonPolygonDTO invalido =
                polygon(
                        -50.00, -21.00,
                        -49.90, -20.90,
                        -49.90, -21.00,
                        -50.00, -20.90
                );

        assertThrows(
                BusinessException.class,
                () ->
                        service.converterParaPolygon(
                                invalido,
                                "Piquete"
                        )
        );
    }

    private GeoJsonPolygonDTO polygon(
            double lon1,
            double lat1,
            double lon2,
            double lat2,
            double lon3,
            double lat3,
            double lon4,
            double lat4
    ) {

        return new GeoJsonPolygonDTO(
                "Polygon",
                List.of(
                        List.of(
                                List.of(lon1, lat1),
                                List.of(lon2, lat2),
                                List.of(lon3, lat3),
                                List.of(lon4, lat4),
                                List.of(lon1, lat1)
                        )
                )
        );
    }
}
