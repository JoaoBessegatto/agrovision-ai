package com.agrovisionai.agrovision_ai.repository;

import com.agrovisionai.agrovision_ai.domain.entity.Animal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AnimalRepository extends JpaRepository<Animal, UUID> {

}
