package com.agrovisionai.agrovision_ai.repository;



import com.agrovisionai.agrovision_ai.domain.entity.RegistroPesos;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface RegistroPesosRepository extends JpaRepository<RegistroPesos, UUID> {

}
