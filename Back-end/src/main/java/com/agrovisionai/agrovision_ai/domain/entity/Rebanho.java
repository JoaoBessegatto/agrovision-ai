package com.agrovisionai.agrovision_ai.domain.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
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
    @JoinColumn(name = "fazenda_id", nullable = false)
    private Fazenda fazenda;

    @OneToMany(
            mappedBy = "rebanho",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<Animal> animais = new ArrayList<>();


    public Rebanho(
            String nome,
            String descricao,
            Fazenda fazenda
    ) {

        validarNome(nome);
        validarFazenda(fazenda);

        this.nome = nome.trim();
        this.descricao = tratarDescricao(descricao);
        this.fazenda = fazenda;
    }


    public void atualizar(
            String nome,
            String descricao
    ) {

        validarNome(nome);

        this.nome = nome.trim();
        this.descricao = tratarDescricao(descricao);
    }


    private void validarNome(String nome) {

        if (nome == null || nome.isBlank()) {

            throw new IllegalArgumentException(
                    "Nome do rebanho é obrigatório"
            );
        }
    }


    private void validarFazenda(Fazenda fazenda) {

        if (fazenda == null) {

            throw new IllegalArgumentException(
                    "Rebanho deve pertencer a uma fazenda"
            );
        }
    }


    private String tratarDescricao(
            String descricao
    ) {

        if (
                descricao == null ||
                        descricao.isBlank()
        ) {
            return null;
        }

        return descricao.trim();
    }


    public int getQuantidadeAnimais() {
        return animais.size();
    }
}