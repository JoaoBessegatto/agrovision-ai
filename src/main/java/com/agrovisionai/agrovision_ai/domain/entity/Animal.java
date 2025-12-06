package com.agrovisionai.agrovision_ai.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "animal")
@Getter
@Setter
@NoArgsConstructor
public class Animal {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "CHAR(36)")
    private UUID Id;

    private String identificacao;
    private String raca;
    private String sexo;
    private Integer idadeMeses;
    private Double pesoAtual;

    @ManyToOne
    private Rebanho rebanho;
}
