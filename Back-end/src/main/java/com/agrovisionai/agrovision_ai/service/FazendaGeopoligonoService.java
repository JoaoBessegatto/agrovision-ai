package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.domain.dto.request.FazendaGeopoligonoRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.request.GeoJsonPolygonDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.FazendaGeopoligonoResponseDTO;
import com.agrovisionai.agrovision_ai.domain.entity.Fazenda;
import com.agrovisionai.agrovision_ai.domain.entity.FazendaGeopoligono;
import com.agrovisionai.agrovision_ai.exception.BusinessException;
import com.agrovisionai.agrovision_ai.repository.FazendaGeopoligonoRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LinearRing;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class FazendaGeopoligonoService {

    private static final int SRID_WGS84 = 4326;
    private static final double RAIO_TERRA_METROS = 6_378_137.0;

    private final FazendaGeopoligonoRepository geopoligonoRepository;
    private final FazendaAccessService fazendaAccessService;

    private final GeometryFactory geometryFactory =
            new GeometryFactory(
                    new PrecisionModel(),
                    SRID_WGS84
            );

    public FazendaGeopoligonoService(
            FazendaGeopoligonoRepository geopoligonoRepository,
            FazendaAccessService fazendaAccessService
    ) {
        this.geopoligonoRepository = geopoligonoRepository;
        this.fazendaAccessService = fazendaAccessService;
    }

    @Transactional(readOnly = true)
    public FazendaGeopoligonoResponseDTO buscar(
            UUID fazendaId
    ) {

        Fazenda fazenda =
                fazendaAccessService
                        .exigirVisualizacao(
                                fazendaId
                        );

        return geopoligonoRepository
                .findByFazendaId(
                        fazendaId
                )
                .map(item ->
                        toResponse(
                                fazenda,
                                item
                        )
                )
                .orElseGet(() ->
                        vazio(fazenda)
                );
    }

    @Transactional
    public FazendaGeopoligonoResponseDTO salvar(
            UUID fazendaId,
            FazendaGeopoligonoRequestDTO dto
    ) {

        Fazenda fazenda =
                fazendaAccessService
                        .exigirProprietario(
                                fazendaId
                        );

        Polygon geometria =
                converterParaPolygon(
                        dto.geometry()
                );

        double areaCalculadaHa =
                calcularAreaHa(
                        dto.geometry()
                );

        if (
                !Double.isFinite(areaCalculadaHa) ||
                areaCalculadaHa <= 0
        ) {
            throw new BusinessException(
                    "A área delimitada precisa ser maior que zero."
            );
        }

        Point centroide =
                geometria.getCentroid();

        FazendaGeopoligono registro =
                geopoligonoRepository
                        .findByFazendaId(
                                fazendaId
                        )
                        .orElseGet(
                                FazendaGeopoligono::new
                        );

        registro.setFazenda(fazenda);
        registro.setGeometria(geometria);
        registro.setAreaCalculadaHa(
                arredondar(
                        areaCalculadaHa,
                        4
                )
        );
        registro.setCentroideLatitude(
                arredondar(
                        centroide.getY(),
                        7
                )
        );
        registro.setCentroideLongitude(
                arredondar(
                        centroide.getX(),
                        7
                )
        );
        registro.setAtualizadoEm(
                LocalDateTime.now()
        );

        /*
         * Latitude e longitude antigas são opcionais.
         * Quando não foram informadas no onboarding,
         * o centroide do limite passa a oferecer um
         * ponto de referência útil para a propriedade.
         */
        if (fazenda.getLatitude() == null) {
            fazenda.setLatitude(
                    registro.getCentroideLatitude()
            );
        }

        if (fazenda.getLongitude() == null) {
            fazenda.setLongitude(
                    registro.getCentroideLongitude()
            );
        }

        FazendaGeopoligono salvo =
                geopoligonoRepository.save(
                        registro
                );

        return toResponse(
                fazenda,
                salvo
        );
    }

    @Transactional
    public void remover(
            UUID fazendaId
    ) {

        fazendaAccessService
                .exigirProprietario(
                        fazendaId
                );

        geopoligonoRepository
                .findByFazendaId(
                        fazendaId
                )
                .ifPresent(
                        geopoligonoRepository::delete
                );
    }

    private Polygon converterParaPolygon(
            GeoJsonPolygonDTO geoJson
    ) {

        if (
                geoJson == null ||
                !"POLYGON".equalsIgnoreCase(
                        geoJson.type()
                )
        ) {
            throw new BusinessException(
                    "A geometria da fazenda deve ser um Polygon GeoJSON."
            );
        }

        List<List<List<Double>>> rings =
                geoJson.coordinates();

        if (
                rings == null ||
                rings.isEmpty()
        ) {
            throw new BusinessException(
                    "O polígono da fazenda não possui coordenadas."
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
                    "O polígono informado é inválido. Verifique cruzamentos entre as linhas e tente novamente."
            );
        }

        return polygon;
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
                        "Uma das coordenadas do polígono está incompleta."
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
                        "Longitude inválida no polígono."
                );
            }

            if (
                    !Double.isFinite(latitude) ||
                    latitude < -90 ||
                    latitude > 90
            ) {
                throw new BusinessException(
                        "Latitude inválida no polígono."
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
                    "O " + descricao +
                            " precisa possuir ao menos três vértices distintos."
            );
        }

        return geometryFactory
                .createLinearRing(
                        coordinates.toArray(
                                Coordinate[]::new
                        )
                );
    }

    private double calcularAreaHa(
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

    /*
     * Fórmula esférica de Chamberlain-Duquette,
     * adequada para polígonos em longitude/latitude
     * e suficiente para a escala de propriedades rurais.
     */
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

    private FazendaGeopoligonoResponseDTO toResponse(
            Fazenda fazenda,
            FazendaGeopoligono registro
    ) {

        Double areaInformada =
                fazenda.getAreaTotalHa();

        Double diferencaArea =
                areaInformada == null
                        ? null
                        : arredondar(
                                registro.getAreaCalculadaHa() -
                                        areaInformada,
                                4
                        );

        Double diferencaPercentual =
                areaInformada == null ||
                areaInformada <= 0
                        ? null
                        : arredondar(
                                (
                                        registro.getAreaCalculadaHa() -
                                        areaInformada
                                ) /
                                        areaInformada *
                                        100.0,
                                2
                        );

        return new FazendaGeopoligonoResponseDTO(
                fazenda.getId(),
                true,
                converterParaGeoJson(
                        registro.getGeometria()
                ),
                registro.getAreaCalculadaHa(),
                areaInformada,
                diferencaArea,
                diferencaPercentual,
                registro.getCentroideLatitude(),
                registro.getCentroideLongitude(),
                registro.getAtualizadoEm()
        );
    }

    private FazendaGeopoligonoResponseDTO vazio(
            Fazenda fazenda
    ) {

        return new FazendaGeopoligonoResponseDTO(
                fazenda.getId(),
                false,
                null,
                null,
                fazenda.getAreaTotalHa(),
                null,
                null,
                fazenda.getLatitude(),
                fazenda.getLongitude(),
                null
        );
    }

    private GeoJsonPolygonDTO converterParaGeoJson(
            Polygon polygon
    ) {

        List<List<List<Double>>> rings =
                new ArrayList<>();

        rings.add(
                converterCoordenadas(
                        polygon.getExteriorRing()
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
                            polygon.getInteriorRingN(i)
                                    .getCoordinates()
                    )
            );
        }

        return new GeoJsonPolygonDTO(
                "Polygon",
                rings
        );
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

    private double arredondar(
            double valor,
            int casas
    ) {

        double fator =
                Math.pow(
                        10,
                        casas
                );

        return Math.round(
                valor * fator
        ) / fator;
    }
}
