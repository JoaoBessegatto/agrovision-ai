package com.agrovisionai.agrovision_ai.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import javax.swing.text.html.Option;
import java.util.Optional;
import java.util.UUID;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {
    public Optional<Usuario> findByEmail(String email);
    public boolean existsByEmail(String email);
}
