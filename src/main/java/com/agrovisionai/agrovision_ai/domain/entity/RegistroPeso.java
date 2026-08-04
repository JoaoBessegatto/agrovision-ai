package com.agrovisionai.agrovision_ai.domain.entity;

import com.agrovisionai.agrovision_ai.auth.Usuario;
import com.agrovisionai.agrovision_ai.domain.enums.SituacaoAnimal;
import com.agrovisionai.agrovision_ai.exception.BusinessException;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "registro_peso")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RegistroPeso {

    @Id
    @GeneratedValue
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "animal_id", nullable = false)
    private Animal animal;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuarioResponsavel;

    @Column(nullable = false)
    private Double pesoKg;


    @Column(nullable = false, updatable = false)
    private LocalDateTime dataRegistro;

    public RegistroPeso(
            Animal animal,
            Usuario usuarioResponsavel,
            Double pesoKg
    ) {

        validarCriacao(animal, usuarioResponsavel, pesoKg);

        this.animal = animal;
        this.usuarioResponsavel = usuarioResponsavel;
        this.pesoKg = pesoKg;
        this.dataRegistro = LocalDateTime.now();
    }

    private void validarCriacao(
            Animal animal,
            Usuario usuarioResponsavel,
            Double pesoKg
    ) {

        if (animal == null) {
            throw new BusinessException("Animal é obrigatório.");
        }

        if (usuarioResponsavel == null) {
            throw new BusinessException("Usuário responsável é obrigatório.");
        }

        if (pesoKg == null) {
            throw new BusinessException("Peso é obrigatório.");
        }

        if (pesoKg <= 0) {
            throw new BusinessException("Peso deve ser maior que zero.");
        }

        if (pesoKg > 1500) {
            throw new BusinessException("Peso informado é inválido.");
        }

        if (animal.getSituacao() != SituacaoAnimal.ATIVO) {
            throw new BusinessException(
                    "Não é possível registrar peso de um animal inativo."
            );
        }
    }
}