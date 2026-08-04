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
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(nullable = false)
    private String identificacao;

    @Column(nullable = false)
    private String raca;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SexoAnimal sexo;

    @Column(nullable = false)
    private LocalDate dataNascimento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SituacaoAnimal situacao;

    @ManyToOne(optional = false)
    private Rebanho rebanho;

    @Column(nullable = false)
    private Double pesoAtual;

    public Animal(
            String identificacao,
            String raca,
            SexoAnimal sexo,
            LocalDate dataNascimento,
            Double pesoAtual,
            Rebanho rebanho
    ) {
        validarCriacao(identificacao, raca, sexo, dataNascimento, rebanho);

        this.identificacao = identificacao;
        this.raca = raca;
        this.sexo = sexo;
        this.dataNascimento = dataNascimento;
        this.rebanho = rebanho;
        this.pesoAtual = pesoAtual;
        this.situacao = SituacaoAnimal.ATIVO;
    }

    private void validarCriacao(
            String identificacao,
            String raca,
            SexoAnimal sexo,
            LocalDate dataNascimento,
            Rebanho rebanho
    ) {
        if (identificacao == null || identificacao.isBlank()) {
            throw new BusinessException("Identificação do animal é obrigatória");
        }
        if (dataNascimento.isAfter(LocalDate.now())) {
            throw new BusinessException("Data de nascimento inválida");
        }
        if (rebanho == null) {
            throw new BusinessException("Animal deve pertencer a um rebanho");
        }
    }
    public void atualizarPeso(Double novoPeso) {
        if (novoPeso == null || novoPeso <= 0) {
            throw new BusinessException("Peso inválido.");
        }

        this.pesoAtual = novoPeso;
    }

    public void inativar() {
        this.situacao = SituacaoAnimal.INATIVO;
    }
    public void ativar(){
        this.situacao = SituacaoAnimal.ATIVO;
    }

    public int getIdadeMeses() {
        Period p = Period.between(this.dataNascimento, LocalDate.now());
        return p.getYears() * 12 + p.getMonths();
    }

    public void mudarRebanho(Rebanho novoRebanho){
        if(novoRebanho == null){
            throw new BusinessException("Rebanho invalido");
        }
        if(this.rebanho.equals(novoRebanho)){
            return;
        }

        this.rebanho = novoRebanho;
    }
}
