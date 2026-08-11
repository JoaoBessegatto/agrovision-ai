package com.agrovisionai.agrovision_ai.repository;



import com.agrovisionai.agrovision_ai.domain.entity.RegistroPeso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RegistroPesoRepository extends JpaRepository<RegistroPeso, UUID> {
    List<RegistroPeso> findByAnimalIdOrderByDataRegistroDesc(UUID animalId);

    Optional<RegistroPeso> findTopByAnimalIdOrderByDataRegistroDesc(UUID animalId);

    @Query("""
          SELECT AVG(r.pesoKg)
            FROM RegistroPeso r
            WHERE r.animal.rebanho.fazenda.id = :fazendaId
          """)
    Double buscarPesoMedio(UUID fazendaId);

    @Query("""
            SELECT MAX(r.dataRegistro)
                FROM RegistroPeso r
                WHERE r.animal.rebanho.fazenda.id = :fazendaId
           """)
    LocalDateTime buscarUltimaPesagem(UUID fazendaId);
}
