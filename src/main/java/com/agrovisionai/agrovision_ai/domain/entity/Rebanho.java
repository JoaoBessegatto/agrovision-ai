package com.agrovisionai.agrovision_ai.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Entity
@Table(name = "rebanho")
@Getter
@Setter
@NoArgsConstructor
public class Rebanho {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private Long id;
    private String nome;
    private String descricao;

    @OneToMany(mappedBy = "rebanho")
    private List<Animal> animais;
}
