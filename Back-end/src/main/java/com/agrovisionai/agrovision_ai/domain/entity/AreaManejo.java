package com.agrovisionai.agrovision_ai.domain.entity;

import com.agrovisionai.agrovision_ai.domain.enums.TipoAreaManejo;
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
        name = "area_manejo",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_area_manejo_fazenda_nome",
                        columnNames = {
                                "fazenda_id",
                                "nome"
                        }
                ),
                @UniqueConstraint(
                        name = "uk_area_manejo_rebanho",
                        columnNames = "rebanho_id"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
public class AreaManejo {

    @Id
    @GeneratedValue
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(
            nullable = false,
            length = 120
    )
    private String nome;

    @Column(length = 500)
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(
            nullable = false,
            length = 30
    )
    private TipoAreaManejo tipo;

    @ManyToOne(
            optional = false,
            fetch = FetchType.LAZY
    )
    @JoinColumn(
            name = "fazenda_id",
            nullable = false
    )
    private Fazenda fazenda;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "rebanho_id",
            unique = true
    )
    private Rebanho rebanho;

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

    /*
     * Para confinamento, a capacidade física do espaço
     * é mais útil do que "cabeças por hectare".
     * É opcional porque pode não estar definida no
     * momento em que a área é desenhada.
     */
    @Column(name = "capacidade_maxima_cabecas")
    private Integer capacidadeMaximaCabecas;

    @Column(
            name = "criado_em",
            nullable = false
    )
    private LocalDateTime criadoEm;

    @Column(
            name = "atualizado_em",
            nullable = false
    )
    private LocalDateTime atualizadoEm;
}
