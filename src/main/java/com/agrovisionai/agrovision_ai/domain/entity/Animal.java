package com.agrovisionai.agrovision_ai.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "animal")
@Getter
@Setter
@NoArgsConstructor
public class Animal {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private Long Id;

    private String identificacao; // brinco / chip / tag
    private String raca;
    private String sexo;
    private Integer idadeMeses;
    private Double pesoAtual;

    @ManyToOne
    private Rebanho rebanho;
}
