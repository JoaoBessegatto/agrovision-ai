package com.agrovisionai.agrovision_ai.repository;

import com.agrovisionai.agrovision_ai.domain.entity.FazendaGeopoligono;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface FazendaGeopoligonoRepository
        extends JpaRepository<FazendaGeopoligono, UUID> {

    Optional<FazendaGeopoligono> findByFazendaId(
            UUID fazendaId
    );

    void deleteByFazendaId(
            UUID fazendaId
    );
}
