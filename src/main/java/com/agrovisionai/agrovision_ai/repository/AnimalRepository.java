package com.agrovisionai.agrovision_ai.repository;

import com.agrovisionai.agrovision_ai.domain.entity.Animal;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnimalRepository extends JpaRepository<Animal, Long> {

}
