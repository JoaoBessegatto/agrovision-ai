package com.agrovisionai.agrovision_ai.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "rebanho")
@Getter
@Setter
@NoArgsConstructor
public class Rebanho {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String nome;
    private String descricao;

    @OneToMany(mappedBy = "rebanho")
    private List<Animal> animais;
}
