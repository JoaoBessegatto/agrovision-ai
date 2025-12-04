package com.agrovisionai.agrovision_ai.repository;


import com.agrovisionai.agrovision_ai.domain.entity.Fazenda;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface FazendaRepository extends JpaRepository<Fazenda, UUID> {

}
