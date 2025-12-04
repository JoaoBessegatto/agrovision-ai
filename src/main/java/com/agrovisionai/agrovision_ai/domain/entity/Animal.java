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
    private UUID Id;

    private String identificacao; // brinco / chip / tag
    private String raca;
    private String sexo;
    private Integer idadeMeses;
    private Double pesoAtual;

    @ManyToOne
    private Rebanho rebanho;
}
