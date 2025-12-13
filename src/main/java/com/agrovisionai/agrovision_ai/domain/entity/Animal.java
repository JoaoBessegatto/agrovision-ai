package com.agrovisionai.agrovision_ai.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(name = "animal")
@Getter
@Setter
@NoArgsConstructor
public class Animal {
    @Id
    @GeneratedValue
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(columnDefinition = "BINARY(16)")
    private UUID Id;

    private String identificacao;
    private String raca;
    private String sexo;
    private Integer idadeMeses;
    private Double pesoAtual;

    @ManyToOne
    private Rebanho rebanho;
}
