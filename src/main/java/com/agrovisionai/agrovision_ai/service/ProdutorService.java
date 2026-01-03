package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.auth.Role;
import com.agrovisionai.agrovision_ai.auth.Usuario;
import com.agrovisionai.agrovision_ai.auth.UsuarioRepository;
import com.agrovisionai.agrovision_ai.domain.dto.request.ProdutorRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.ProdutorResponseDTO;
import com.agrovisionai.agrovision_ai.domain.entity.Produtor;
import com.agrovisionai.agrovision_ai.repository.ProdutorRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;


@Service
public class ProdutorService {

    private final ProdutorRepository produtorRepository;
    private final UsuarioRepository usuarioRepository;

    public ProdutorService(ProdutorRepository produtorRepository,
                           UsuarioRepository usuarioRepository) {
        this.produtorRepository = produtorRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public ProdutorResponseDTO cadastrar(ProdutorRequestDTO dto){
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Usuario usuarioLogado = (Usuario) auth.getPrincipal();

        if(usuarioLogado.getRole() != Role.PRODUTOR){
            throw new RuntimeException("O Usuário não possui Role Produtor");
        }

        if(produtorRepository.existsByUsuario(usuarioLogado)){
            throw new RuntimeException("Este usuário ja esta vinculado a um produtor");
        }

        Produtor produtor = new Produtor();
        produtor.setCpfOrCnpj(dto.cpfOrCnpj());
        produtor.setNomeCompleto(dto.nomeCompleto());
        produtor.setDataNascimento(dto.dataNascimento());
        produtor.setUsuario(usuarioLogado);
        produtor.setTelefone(dto.telefone());

        Produtor produtorSave = produtorRepository.save(produtor);
        return new ProdutorResponseDTO(produtorSave);
    }
    public ProdutorResponseDTO atualizar(ProdutorRequestDTO dto){
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Usuario usuarioLogado = (Usuario) auth.getPrincipal();

        if(usuarioLogado.getRole() != Role.PRODUTOR){
            throw new RuntimeException("O Usuario não possui permição para atualizar");
        }

        Produtor produtor = produtorRepository.findByUsuario(usuarioLogado)
                .orElseThrow(() -> new RuntimeException("Produtor não encontrado para este usuário"));

        produtor.setNomeCompleto(dto.nomeCompleto());
        produtor.setCpfOrCnpj(dto.cpfOrCnpj());
        produtor.setDataNascimento(dto.dataNascimento());
        produtor.setTelefone(dto.telefone());

        Produtor produtorAtualizado = produtorRepository.save(produtor);

        return new ProdutorResponseDTO(produtorAtualizado);
    }
    public boolean deletar (){
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Usuario usuarioLogado = (Usuario) auth.getPrincipal();

        if (usuarioLogado.getRole() != Role.PRODUTOR) {
            throw new RuntimeException("Usuário não possui permissão para deletar produtor");
        }

        Produtor produtor = produtorRepository.findByUsuario(usuarioLogado)
                .orElseThrow(() -> new RuntimeException("Produtor não encontrado"));

        produtorRepository.delete(produtor);
        return true;
    }
    @Transactional(readOnly = true)
    public List<ProdutorResponseDTO> findAll(){
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Usuario usuarioLogado = (Usuario) auth.getPrincipal();

        if(usuarioLogado.getRole() != Role.ADMIN){
            throw new RuntimeException("Somente ADMIN podem fazer essa requisição");
        }
        return produtorRepository.findAll()
                .stream()
                .map(ProdutorResponseDTO::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProdutorResponseDTO findMe(){
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Usuario usuarioLogado = (Usuario) auth.getPrincipal();

        Produtor produtor = produtorRepository.findByUsuario(usuarioLogado)
                .orElseThrow(() -> new RuntimeException("Produtor não encontrado"));

        return new ProdutorResponseDTO(produtor);
    }
}
