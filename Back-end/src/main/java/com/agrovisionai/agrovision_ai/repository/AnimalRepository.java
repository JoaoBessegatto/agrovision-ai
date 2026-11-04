package com.agrovisionai.agrovision_ai.repository;

import com.agrovisionai.agrovision_ai.domain.entity.Animal;
import com.agrovisionai.agrovision_ai.domain.enums.SituacaoAnimal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AnimalRepository
        extends JpaRepository<Animal, UUID> {


    boolean existsByIdentificacaoIgnoreCaseAndRebanhoFazendaId(
            String identificacao,
            UUID fazendaId
    );


    Optional<Animal>
    findByIdentificacaoIgnoreCaseAndRebanhoFazendaId(
            String identificacao,
            UUID fazendaId
    );


    List<Animal> findByRebanhoId(
            UUID rebanhoId
    );


    List<Animal> findByRebanhoFazendaId(
            UUID fazendaId
    );


    List<Animal> findBySituacao(
            SituacaoAnimal situacao
    );
}