package com.agrovisionai.agrovision_ai.repository;


import com.agrovisionai.agrovision_ai.domain.entity.Rebanho;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface RebanhoRepository extends JpaRepository<Rebanho, UUID> {

}
