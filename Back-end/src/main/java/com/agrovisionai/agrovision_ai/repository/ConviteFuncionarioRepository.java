package com.agrovisionai.agrovision_ai.repository;

import com.agrovisionai.agrovision_ai.domain.entity.ConviteFuncionario;
import com.agrovisionai.agrovision_ai.domain.enums.StatusConviteFuncionario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConviteFuncionarioRepository
        extends JpaRepository<ConviteFuncionario, UUID> {

    Optional<ConviteFuncionario> findByTokenHash(String tokenHash);

    List<ConviteFuncionario> findByFazendaIdOrderByCriadoEmDesc(UUID fazendaId);

    Optional<ConviteFuncionario>
    findFirstByEmailIgnoreCaseAndFazendaIdAndStatusOrderByCriadoEmDesc(
            String email,
            UUID fazendaId,
            StatusConviteFuncionario status
    );
}
