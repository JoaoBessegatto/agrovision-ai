package com.agrovisionai.agrovision_ai.domain.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
@Entity
@Table(name = "rebanho")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Rebanho {

    @Id
    @GeneratedValue
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(nullable = false)
    private String nome;

    @Column(length = 500)
    private String descricao;

    @ManyToOne(optional = false)
    private Fazenda fazenda;

    @OneToMany(mappedBy = "rebanho", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Animal> animais;

    public Rebanho(String nome, String descricao, Fazenda fazenda) {
        validarCriacao(nome, fazenda);

        this.nome = nome;
        this.descricao = descricao;
        this.fazenda = fazenda;
    }

    private void validarCriacao(String nome, Fazenda fazenda) {
        if (nome == null || nome.isBlank()) {
            throw new RuntimeException("Nome do rebanho é obrigatório");
        }
        if (fazenda == null) {
            throw new RuntimeException("Rebanho deve pertencer a uma fazenda");
        }
    }


    public int getQuantidadeAnimais() {
        return this.animais.size();
    }
}

