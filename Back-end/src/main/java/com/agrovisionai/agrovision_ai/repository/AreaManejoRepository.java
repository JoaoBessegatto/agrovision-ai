package com.agrovisionai.agrovision_ai.repository;

import com.agrovisionai.agrovision_ai.domain.entity.AreaManejo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AreaManejoRepository
        extends JpaRepository<AreaManejo, UUID> {

    List<AreaManejo> findByFazendaIdOrderByNomeAsc(
            UUID fazendaId
    );

    Optional<AreaManejo> findByRebanhoId(
            UUID rebanhoId
    );

    boolean existsByFazendaIdAndNomeIgnoreCase(
            UUID fazendaId,
            String nome
    );

    boolean existsByFazendaIdAndNomeIgnoreCaseAndIdNot(
            UUID fazendaId,
            String nome,
            UUID id
    );
}
