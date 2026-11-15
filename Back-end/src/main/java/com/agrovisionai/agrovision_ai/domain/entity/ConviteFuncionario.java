package com.agrovisionai.agrovision_ai.domain.entity;

import com.agrovisionai.agrovision_ai.auth.Usuario;
import com.agrovisionai.agrovision_ai.domain.enums.CargoFuncionario;
import com.agrovisionai.agrovision_ai.domain.enums.StatusConviteFuncionario;
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
@Table(
        name = "convite_funcionario",
        indexes = {
                @Index(name = "idx_convite_funcionario_email", columnList = "email"),
                @Index(name = "idx_convite_funcionario_fazenda", columnList = "fazenda_id")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ConviteFuncionario {

    @Id
    @GeneratedValue
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(nullable = false, length = 320)
    private String email;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "fazenda_id", nullable = false)
    private Fazenda fazenda;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CargoFuncionario cargo;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "convidado_por_usuario_id", nullable = false)
    private Usuario convidadoPor;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusConviteFuncionario status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @Column(nullable = false)
    private LocalDateTime expiraEm;

    private LocalDateTime aceitoEm;

    public ConviteFuncionario(
            String email,
            Fazenda fazenda,
            CargoFuncionario cargo,
            Usuario convidadoPor,
            String tokenHash,
            LocalDateTime expiraEm
    ) {
        if (email == null || email.isBlank()) {
            throw new BusinessException("E-mail do funcionário é obrigatório.");
        }

        if (fazenda == null) {
            throw new BusinessException("Fazenda do convite é obrigatória.");
        }

        if (cargo == null) {
            throw new BusinessException("Cargo do funcionário é obrigatório.");
        }

        if (convidadoPor == null) {
            throw new BusinessException("Usuário responsável pelo convite é obrigatório.");
        }

        if (tokenHash == null || tokenHash.isBlank()) {
            throw new BusinessException("Token do convite é obrigatório.");
        }

        if (expiraEm == null || !expiraEm.isAfter(LocalDateTime.now())) {
            throw new BusinessException("Data de expiração do convite é inválida.");
        }

        this.email = email.trim().toLowerCase();
        this.fazenda = fazenda;
        this.cargo = cargo;
        this.convidadoPor = convidadoPor;
        this.tokenHash = tokenHash;
        this.status = StatusConviteFuncionario.PENDENTE;
        this.criadoEm = LocalDateTime.now();
        this.expiraEm = expiraEm;
    }

    public boolean estaExpirado() {
        return status == StatusConviteFuncionario.PENDENTE
                && LocalDateTime.now().isAfter(expiraEm);
    }

    public StatusConviteFuncionario getStatusEfetivo() {
        if (estaExpirado()) {
            return StatusConviteFuncionario.EXPIRADO;
        }

        return status;
    }

    public boolean podeSerAceito() {
        return status == StatusConviteFuncionario.PENDENTE && !estaExpirado();
    }

    public void aceitar() {
        if (!podeSerAceito()) {
            throw new BusinessException("Este convite não está disponível para aceite.");
        }

        this.status = StatusConviteFuncionario.ACEITO;
        this.aceitoEm = LocalDateTime.now();
    }

    public void cancelar() {
        if (status == StatusConviteFuncionario.ACEITO) {
            throw new BusinessException("Um convite já aceito não pode ser cancelado.");
        }

        this.status = StatusConviteFuncionario.CANCELADO;
    }

    public void renovar(String novoTokenHash, LocalDateTime novaExpiracao) {
        if (status == StatusConviteFuncionario.ACEITO) {
            throw new BusinessException("Um convite já aceito não pode ser reenviado.");
        }

        if (status == StatusConviteFuncionario.CANCELADO) {
            throw new BusinessException("Um convite cancelado não pode ser reenviado.");
        }

        if (novoTokenHash == null || novoTokenHash.isBlank()) {
            throw new BusinessException("Token do convite é obrigatório.");
        }

        if (novaExpiracao == null || !novaExpiracao.isAfter(LocalDateTime.now())) {
            throw new BusinessException("Data de expiração do convite é inválida.");
        }

        this.tokenHash = novoTokenHash;
        this.expiraEm = novaExpiracao;
        this.status = StatusConviteFuncionario.PENDENTE;
    }
}
