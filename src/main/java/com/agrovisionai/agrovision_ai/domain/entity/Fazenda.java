package com.agrovisionai.agrovision_ai.domain.entity;

import com.agrovisionai.agrovision_ai.domain.enums.TipoExploracao;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "fazenda")
@Getter
@Setter
@NoArgsConstructor
public class Fazenda {

    @Id
    @GeneratedValue
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false)
    private String cidade;

    @Column(nullable = false)
    private String estado;

    private Double latitude;
    private Double longitude;

    @Column(nullable = false)
    private Double areaTotalHa;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoExploracao exploracao;

    @Column(columnDefinition = "TEXT")
    private String geopoligono;

    @ManyToOne
    @JoinColumn(name = "produtor_id")
    private Produtor produtor;

    @OneToMany(mappedBy = "fazenda", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Rebanho> rebanhos;


}
