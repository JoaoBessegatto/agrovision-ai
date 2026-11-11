package com.agrovisionai.agrovision_ai.repository;

import com.agrovisionai.agrovision_ai.domain.entity.RegistroPeso;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;


public interface RegistroPesoRepository
        extends JpaRepository<RegistroPeso, UUID> {


    List<RegistroPeso> findByAnimalIdOrderByDataRegistroDesc(
            UUID animalId
    );


    List<RegistroPeso>
    findByAnimalRebanhoFazendaIdOrderByDataRegistroDesc(
            UUID fazendaId
    );


    Optional<RegistroPeso>
    findFirstByAnimalIdOrderByDataRegistroDesc(
            UUID animalId
    );


    long countByAnimalId(
            UUID animalId
    );

    long countByAnimalRebanhoFazendaId(
            UUID fazendaId
    );


    @Query("""
        SELECT MAX(r.dataRegistro)
        FROM RegistroPeso r
        WHERE r.animal.rebanho.fazenda.id = :fazendaId
    """)
    LocalDateTime buscarUltimaPesagem(
            @Param("fazendaId")
            UUID fazendaId
    );


    @Query("""
        SELECT
            YEAR(r.dataRegistro),
            MONTH(r.dataRegistro),
            AVG(r.pesoKg)
        FROM RegistroPeso r
        WHERE r.animal.rebanho.fazenda.id = :fazendaId
          AND r.dataRegistro >= :inicio
        GROUP BY
            YEAR(r.dataRegistro),
            MONTH(r.dataRegistro)
        ORDER BY
            YEAR(r.dataRegistro),
            MONTH(r.dataRegistro)
    """)
    List<Object[]> buscarEvolucaoPeso(
            @Param("fazendaId")
            UUID fazendaId,

            @Param("inicio")
            LocalDateTime inicio
    );
}