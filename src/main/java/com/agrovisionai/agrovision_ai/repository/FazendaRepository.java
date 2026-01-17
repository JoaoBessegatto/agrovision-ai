package com.agrovisionai.agrovision_ai.repository;


import com.agrovisionai.agrovision_ai.domain.entity.Fazenda;
import com.agrovisionai.agrovision_ai.domain.entity.Produtor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FazendaRepository extends JpaRepository<Fazenda, UUID> {

    Optional<Fazenda> findByIdAndProdutor(UUID id, Produtor produtor);

}
