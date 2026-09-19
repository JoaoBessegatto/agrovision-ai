package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.auth.CurrentUserProvider;
import com.agrovisionai.agrovision_ai.auth.Role;
import com.agrovisionai.agrovision_ai.auth.Usuario;
import com.agrovisionai.agrovision_ai.domain.dto.request.ProdutorRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.ProdutorResponseDTO;
import com.agrovisionai.agrovision_ai.domain.entity.Produtor;
import com.agrovisionai.agrovision_ai.exception.BusinessException;
import com.agrovisionai.agrovision_ai.exception.ResouceNotFoundException;
import com.agrovisionai.agrovision_ai.exception.UnauthorizedException;
import com.agrovisionai.agrovision_ai.repository.ProdutorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProdutorService {

    private final ProdutorRepository produtorRepository;
    private final CurrentUserProvider currentUserProvider;

    public ProdutorService(
            ProdutorRepository produtorRepository,
            CurrentUserProvider currentUserProvider
    ) {
        this.produtorRepository = produtorRepository;
        this.currentUserProvider = currentUserProvider;
    }

    @Transactional
    public ProdutorResponseDTO cadastrar(ProdutorRequestDTO dto) {

        Usuario usuarioLogado =
                currentUserProvider.getUsuarioAtual();

        if (produtorRepository.existsByUsuario(usuarioLogado)) {

            throw new BusinessException(
                    "Este usuário já possui um perfil de produtor."
            );
        }

        Produtor produtor = new Produtor();

        produtor.setNomeCompleto(dto.nomeCompleto());
        produtor.setCpfOrCnpj(dto.cpfOrCnpj());
        produtor.setDataNascimento(dto.dataNascimento());
        produtor.setTelefone(dto.telefone());

        produtor.setUsuario(usuarioLogado);

        Produtor produtorSalvo =
                produtorRepository.save(produtor);

        return new ProdutorResponseDTO(produtorSalvo);
    }

    @Transactional
    public ProdutorResponseDTO atualizar(ProdutorRequestDTO dto) {

        Usuario usuarioLogado =
                currentUserProvider.getUsuarioAtual();

        Produtor produtor =
                produtorRepository
                        .findByUsuario(usuarioLogado)
                        .orElseThrow(() ->
                                new ResouceNotFoundException(
                                        "Perfil de produtor não encontrado para este usuário."
                                )
                        );

        produtor.setNomeCompleto(dto.nomeCompleto());
        produtor.setCpfOrCnpj(dto.cpfOrCnpj());
        produtor.setDataNascimento(dto.dataNascimento());
        produtor.setTelefone(dto.telefone());

        Produtor produtorAtualizado =
                produtorRepository.save(produtor);

        return new ProdutorResponseDTO(
                produtorAtualizado
        );
    }

    @Transactional
    public boolean deletar() {

        Usuario usuarioLogado =
                currentUserProvider.getUsuarioAtual();

        Produtor produtor =
                produtorRepository
                        .findByUsuario(usuarioLogado)
                        .orElseThrow(() ->
                                new ResouceNotFoundException(
                                        "Perfil de produtor não encontrado."
                                )
                        );

        produtorRepository.delete(produtor);

        return true;
    }

    @Transactional(readOnly = true)
    public List<ProdutorResponseDTO> findAll() {

        Usuario usuarioLogado =
                currentUserProvider.getUsuarioAtual();

        if (usuarioLogado.getRole() != Role.ADMIN) {

            throw new UnauthorizedException(
                    "Somente administradores podem listar todos os produtores."
            );
        }

        return produtorRepository
                .findAll()
                .stream()
                .map(ProdutorResponseDTO::new)
                .toList();
    }


    @Transactional(readOnly = true)
    public ProdutorResponseDTO findMe() {

        Usuario usuarioLogado =
                currentUserProvider.getUsuarioAtual();

        Produtor produtor =
                produtorRepository
                        .findByUsuario(usuarioLogado)
                        .orElseThrow(() ->
                                new ResouceNotFoundException(
                                        "Perfil de produtor não encontrado para este usuário."
                                )
                        );

        return new ProdutorResponseDTO(produtor);
    }

}