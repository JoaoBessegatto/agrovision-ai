package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.auth.Role;
import com.agrovisionai.agrovision_ai.auth.Usuario;
import com.agrovisionai.agrovision_ai.auth.UsuarioRepository;
import com.agrovisionai.agrovision_ai.domain.dto.request.ProdutorRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.ProdutorResponseDTO;
import com.agrovisionai.agrovision_ai.domain.entity.Produtor;
import com.agrovisionai.agrovision_ai.repository.ProdutorRepository;
import org.springframework.beans.factory.annotation.Autowired;

public class ProdutorService {
    @Autowired
    ProdutorRepository produtorRepository;

    @Autowired
    UsuarioRepository usuarioRepository;

    public ProdutorResponseDTO cadastrar(ProdutorRequestDTO dto){
        Usuario usuario = usuarioRepository.findById(dto.usuarioId())
                .orElseThrow(() -> new RuntimeException("Usuario não encontrado!"));

        if(!usuario.getRole().equals(Role.PRODUTOR)){
            throw new RuntimeException("Usuário não é um produtor");
        }
        Produtor produtor = new Produtor();
        produtor.setCpfOrCnpj(dto.cpfOrCnpj());
        produtor.setNomeCompleto(dto.nomeCompleto());
        produtor.setDataNascimento(dto.dataNascimento());
        produtor.setUsuario(usuario);
        produtor.setTelefone(dto.telefone());

        Produtor produtorSave = produtorRepository.save(produtor);
        return new ProdutorResponseDTO(produtorSave);
    }
}
