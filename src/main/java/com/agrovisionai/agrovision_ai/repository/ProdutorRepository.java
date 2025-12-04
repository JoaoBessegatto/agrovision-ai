package com.agrovisionai.agrovision_ai.repository;


import com.agrovisionai.agrovision_ai.domain.entity.Produtor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProdutorRepository extends JpaRepository<Produtor, UUID> {

}
