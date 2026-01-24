package com.agrovisionai.agrovision_ai.domain.entity;

import com.agrovisionai.agrovision_ai.auth.Usuario;
import com.agrovisionai.agrovision_ai.domain.enums.CargoFuncionario;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "funcionario",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {"usuario_id", "fazenda_id"}
                )
        })
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Funcionario {

    @Id
    @GeneratedValue
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @OneToOne(optional = false)
    private Usuario usuario;

    @ManyToOne(optional = false)
    private Fazenda fazenda;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CargoFuncionario cargo;

    @Column(nullable = false)
    private boolean ativo;

    @Column(nullable = false, updatable = false)
    private LocalDateTime dataVinculo;

    public Funcionario(
            Usuario usuario,
            Fazenda fazenda,
            CargoFuncionario cargo
    ) {
        validarCriacao(usuario, fazenda, cargo);

        this.usuario = usuario;
        this.fazenda = fazenda;
        this.cargo = cargo;
        this.ativo = true;
        this.dataVinculo = LocalDateTime.now();
    }

    private void validarCriacao(
            Usuario usuario,
            Fazenda fazenda,
            CargoFuncionario cargo
    ) {
        if (usuario == null) {
            throw new RuntimeException("Usuário é obrigatório");
        }
        if (fazenda == null) {
            throw new RuntimeException("Funcionário deve pertencer a uma fazenda");
        }
        if (cargo == null) {
            throw new RuntimeException("Cargo do funcionário é obrigatório");
        }
    }

    public void alterarCargo(CargoFuncionario novoCargo) {
        if (novoCargo == null) {
            throw new RuntimeException("Cargo inválido");
        }
        this.cargo = novoCargo;
    }

    public void desativar() {
        this.ativo = false;
    }

    public void ativar() {
        this.ativo = true;
    }


    public boolean podeRegistrarPeso() {
        return ativo && cargo.podeRegistrarPeso();
    }

    public boolean podeTransferirAnimal() {
        return ativo && cargo.podeTransferirAnimal();
    }

    public boolean podeGerenciarRebanho() {
        return ativo && cargo.podeGerenciarRebanho();
    }
}
