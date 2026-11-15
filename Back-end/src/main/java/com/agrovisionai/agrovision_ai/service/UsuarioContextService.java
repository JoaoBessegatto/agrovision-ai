package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.auth.CurrentUserProvider;
import com.agrovisionai.agrovision_ai.auth.Role;
import com.agrovisionai.agrovision_ai.auth.Usuario;
import com.agrovisionai.agrovision_ai.domain.dto.response.UsuarioContextResponseDTO;
import com.agrovisionai.agrovision_ai.domain.entity.Produtor;
import com.agrovisionai.agrovision_ai.repository.FazendaRepository;
import com.agrovisionai.agrovision_ai.repository.FuncionarioRepository;
import com.agrovisionai.agrovision_ai.repository.ProdutorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class UsuarioContextService {

    private final CurrentUserProvider currentUserProvider;
    private final ProdutorRepository produtorRepository;
    private final FazendaRepository fazendaRepository;
    private final FuncionarioRepository funcionarioRepository;

    public UsuarioContextService(
            CurrentUserProvider currentUserProvider,
            ProdutorRepository produtorRepository,
            FazendaRepository fazendaRepository,
            FuncionarioRepository funcionarioRepository
    ) {
        this.currentUserProvider = currentUserProvider;
        this.produtorRepository = produtorRepository;
        this.fazendaRepository = fazendaRepository;
        this.funcionarioRepository = funcionarioRepository;
    }

    @Transactional(readOnly = true)
    public UsuarioContextResponseDTO getContextoAtual() {

        Usuario usuario = currentUserProvider.getUsuarioAtual();

        Optional<Produtor> produtor =
                produtorRepository.findByUsuario(usuario);

        boolean possuiPerfilProdutor =
                produtor.isPresent();

        boolean possuiFazenda =
                produtor
                        .map(fazendaRepository::existsByProdutor)
                        .orElse(false);

        boolean possuiVinculoFuncionario =
                funcionarioRepository
                        .existsByUsuarioIdAndAtivoTrue(usuario.getId());

        boolean admin =
                usuario.getRole() == Role.ADMIN;

        boolean possuiAcessoFazenda =
                admin ||
                possuiFazenda ||
                possuiVinculoFuncionario;

        return new UsuarioContextResponseDTO(
                usuario.getId(),
                usuario.getName(),
                usuario.getEmail(),
                admin,
                possuiPerfilProdutor,
                possuiFazenda,
                possuiVinculoFuncionario,
                possuiAcessoFazenda
        );
    }
}
