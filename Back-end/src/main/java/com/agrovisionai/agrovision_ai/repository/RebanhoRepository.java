package com.agrovisionai.agrovision_ai.repository;

import com.agrovisionai.agrovision_ai.domain.entity.Rebanho;
import com.agrovisionai.agrovision_ai.domain.enums.SituacaoAnimal;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;


public interface RebanhoRepository
        extends JpaRepository<Rebanho, UUID> {


    List<Rebanho> findByFazendaIdOrderByNomeAsc(
            UUID fazendaId
    );


    Optional<Rebanho> findByIdAndFazendaId(
            UUID rebanhoId,
            UUID fazendaId
    );


    long countByFazendaId(
            UUID fazendaId
    );


    @Query("""
        SELECT
            r.id,
            r.nome,
            COUNT(a.id),
            SUM(
                CASE
                    WHEN a.situacao = :situacaoAtiva
                    THEN 1
                    ELSE 0
                END
            ),
            AVG(
                CASE
                    WHEN a.situacao = :situacaoAtiva
                    THEN a.pesoAtual
                    ELSE NULL
                END
            )
        FROM Rebanho r
        LEFT JOIN r.animais a
        WHERE r.fazenda.id = :fazendaId
        GROUP BY r.id, r.nome
        ORDER BY r.nome ASC
    """)
    List<Object[]> buscarResumoDashboard(
            @Param("fazendaId")
            UUID fazendaId,

            @Param("situacaoAtiva")
            SituacaoAnimal situacaoAtiva
    );
}