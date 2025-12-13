package com.agrovisionai.agrovision_ai.repository;


import com.agrovisionai.agrovision_ai.auth.Usuario;
import com.agrovisionai.agrovision_ai.domain.entity.Produtor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProdutorRepository extends JpaRepository<Produtor, UUID> {
    boolean existsByUsuario(Usuario usuario);

    Optional<Produtor> findByUsuario(Usuario usuario);
}
