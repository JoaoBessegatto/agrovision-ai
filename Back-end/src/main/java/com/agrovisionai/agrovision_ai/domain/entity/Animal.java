package com.agrovisionai.agrovision_ai.domain.entity;

import com.agrovisionai.agrovision_ai.domain.enums.SexoAnimal;
import com.agrovisionai.agrovision_ai.domain.enums.SituacaoAnimal;
import com.agrovisionai.agrovision_ai.exception.BusinessException;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.Period;
import java.util.UUID;

@Entity
@Table(name = "animal")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Animal {

    @Id
    @GeneratedValue
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(
            columnDefinition = "BINARY(16)"
    )
    private UUID id;

    @Column(
            nullable = false
    )
    private String identificacao;


    @Column(
            nullable = false
    )
    private String raca;


    @Enumerated(EnumType.STRING)
    @Column(
            nullable = false
    )
    private SexoAnimal sexo;


    @Column(
            nullable = false
    )
    private LocalDate dataNascimento;


    @Enumerated(EnumType.STRING)
    @Column(
            nullable = false
    )
    private SituacaoAnimal situacao;


    @Column(
            nullable = false
    )
    private Double pesoAtual;

    @ManyToOne(
            optional = false,
            fetch = FetchType.LAZY
    )
    @JoinColumn(
            name = "rebanho_id",
            nullable = false
    )
    private Rebanho rebanho;

    public Animal(
            String identificacao,
            String raca,
            SexoAnimal sexo,
            LocalDate dataNascimento,
            Double pesoAtual,
            Rebanho rebanho
    ) {

        validarCriacao(
                identificacao,
                raca,
                sexo,
                dataNascimento,
                pesoAtual,
                rebanho
        );

        this.identificacao =
                identificacao.trim();

        this.raca =
                raca.trim();

        this.sexo =
                sexo;

        this.dataNascimento =
                dataNascimento;

        this.pesoAtual =
                pesoAtual;

        this.rebanho =
                rebanho;

        this.situacao =
                SituacaoAnimal.ATIVO;
    }


    private void validarCriacao(
            String identificacao,
            String raca,
            SexoAnimal sexo,
            LocalDate dataNascimento,
            Double pesoAtual,
            Rebanho rebanho
    ) {

        if (
                identificacao == null ||
                        identificacao.isBlank()
        ) {

            throw new BusinessException(
                    "Identificação do animal é obrigatória."
            );
        }


        if (
                raca == null ||
                        raca.isBlank()
        ) {

            throw new BusinessException(
                    "Raça do animal é obrigatória."
            );
        }


        if (sexo == null) {

            throw new BusinessException(
                    "Sexo do animal é obrigatório."
            );
        }


        if (dataNascimento == null) {

            throw new BusinessException(
                    "Data de nascimento é obrigatória."
            );
        }


        if (
                dataNascimento.isAfter(
                        LocalDate.now()
                )
        ) {

            throw new BusinessException(
                    "A data de nascimento não pode ser futura."
            );
        }


        if (
                pesoAtual == null ||
                        pesoAtual <= 0
        ) {

            throw new BusinessException(
                    "Peso atual inválido."
            );
        }


        if (rebanho == null) {

            throw new BusinessException(
                    "Animal deve pertencer a um rebanho."
            );
        }
    }

    public void atualizarPeso(
            Double novoPeso
    ) {

        if (
                novoPeso == null ||
                        novoPeso <= 0
        ) {

            throw new BusinessException(
                    "Peso inválido."
            );
        }


        this.pesoAtual =
                novoPeso;
    }

    public void inativar() {

        if (
                this.situacao ==
                        SituacaoAnimal.INATIVO
        ) {
            return;
        }


        this.situacao =
                SituacaoAnimal.INATIVO;
    }


    public void ativar() {

        if (
                this.situacao ==
                        SituacaoAnimal.ATIVO
        ) {
            return;
        }


        this.situacao =
                SituacaoAnimal.ATIVO;
    }

    public int getIdadeMeses() {

        Period periodo =
                Period.between(
                        this.dataNascimento,
                        LocalDate.now()
                );


        return (
                periodo.getYears() * 12
        ) + periodo.getMonths();
    }

    public void mudarRebanho(
            Rebanho novoRebanho
    ) {

        if (novoRebanho == null) {

            throw new BusinessException(
                    "Novo rebanho inválido."
            );
        }


        if (
                this.rebanho != null &&
                        this.rebanho
                                .getId()
                                .equals(novoRebanho.getId())
        ) {
            return;
        }


        this.rebanho =
                novoRebanho;
    }
}