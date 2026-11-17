package com.agrovisionai.agrovision_ai.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.Polygon;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "fazenda_geopoligono",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_fazenda_geopoligono_fazenda",
                        columnNames = "fazenda_id"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
public class FazendaGeopoligono {

    @Id
    @GeneratedValue
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(
            name = "fazenda_id",
            nullable = false,
            unique = true
    )
    private Fazenda fazenda;

    @Column(
            name = "geometria",
            nullable = false,
            columnDefinition = "POLYGON"
    )
    private Polygon geometria;

    @Column(
            name = "area_calculada_ha",
            nullable = false
    )
    private Double areaCalculadaHa;

    @Column(
            name = "centroide_latitude",
            nullable = false
    )
    private Double centroideLatitude;

    @Column(
            name = "centroide_longitude",
            nullable = false
    )
    private Double centroideLongitude;

    @Column(
            name = "atualizado_em",
            nullable = false
    )
    private LocalDateTime atualizadoEm;
}
