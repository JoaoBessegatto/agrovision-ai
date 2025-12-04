package com.agrovisionai.agrovision_ai.domain.entity;

import com.agrovisionai.agrovision_ai.domain.enums.TipoExploracao;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "fazenda")
@Getter
@Setter
@NoArgsConstructor
public class Fazenda {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
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
}
