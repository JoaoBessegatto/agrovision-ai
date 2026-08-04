package com.agrovisionai.agrovision_ai.repository;



import com.agrovisionai.agrovision_ai.domain.entity.RegistroPeso;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RegistroPesoRepository extends JpaRepository<RegistroPeso, UUID> {
    List<RegistroPeso> findByAnimalIdOrderByDataRegistroDesc(UUID animalId);

    Optional<RegistroPeso> findTopByAnimalIdOrderByDataRegistroDesc(UUID animalId);
}
