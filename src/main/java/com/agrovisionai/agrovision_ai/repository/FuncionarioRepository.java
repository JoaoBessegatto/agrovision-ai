package com.agrovisionai.agrovision_ai.repository;

import com.agrovisionai.agrovision_ai.domain.entity.Funcionario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FuncionarioRepository extends JpaRepository<Funcionario, UUID> {
    boolean existsByUsuarioIdAndFazendaId(UUID usuarioId, UUID fazendaId);
    Optional<Funcionario> findByUsuarioIdAndFazendaId(UUID usuarioID, UUID fazendaId);
    List<Funcionario> findByFazendaId(UUID fazendaId);

}
