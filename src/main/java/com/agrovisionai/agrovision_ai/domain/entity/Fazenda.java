package com.agrovisionai.agrovision_ai.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "fazenda")
@Getter
@Setter
@NoArgsConstructor
public class Fazenda {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private Long id;

    private String nome;
    private String cidade;
    private String estado;

    @ManyToOne
    private Produtor produtor;
}
