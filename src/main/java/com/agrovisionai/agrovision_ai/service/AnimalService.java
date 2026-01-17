package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.auth.CurrentUserProvider;
import com.agrovisionai.agrovision_ai.auth.Usuario;
import com.agrovisionai.agrovision_ai.domain.dto.request.AnimalRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.AnimalResponseDTO;
import com.agrovisionai.agrovision_ai.domain.entity.Animal;
import com.agrovisionai.agrovision_ai.domain.entity.Rebanho;
import com.agrovisionai.agrovision_ai.repository.AnimalRepository;
import com.agrovisionai.agrovision_ai.repository.RebanhoRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AnimalService {
    private final AnimalRepository animalRepository;
    private final RebanhoRepository rebanhoRepository;
    private final CurrentUserProvider currentUserProvider;

    public AnimalService(AnimalRepository animalRepository, RebanhoRepository rebanhoRepository, CurrentUserProvider currentUserProvider) {
        this.animalRepository = animalRepository;
        this.rebanhoRepository = rebanhoRepository;
        this.currentUserProvider = currentUserProvider;
    }

    public AnimalResponseDTO cadastrar(AnimalRequestDTO dto){
        Usuario usuarioLogado = currentUserProvider.getUsuarioAtual();

        Rebanho rebanho = rebanhoRepository.findById(dto.rebanhoId())
                .orElseThrow(() -> new RuntimeException("Rebanho não encontrado"));

        validarPermissao(usuarioLogado, rebanho);

        if(animalRepository.existsByIndentificacao(dto.identificacao())){
            throw new RuntimeException("Ja existe um animal com essa identificação");
        }
        Animal animal = new Animal(
                dto.identificacao(),
                dto.raca(),
                dto.sexo(),
                dto.dataNascimento(),
                rebanho
        );
        animalRepository.save(animal);
        return AnimalResponseDTO.from(animal);
    }
    public void trasferirAnimal(UUID animalId, UUID rebanhoId){
        Usuario usuarioLogado = currentUserProvider.getUsuarioAtual();

        Rebanho rebanho = rebanhoRepository.findById(rebanhoId)
                        .orElseThrow(() -> new RuntimeException("Rebanho não encontrado"));

        validarPermissao(usuarioLogado, rebanho);

        Animal animal = animalRepository.findById(animalId)
                .orElseThrow(() -> new RuntimeException("Animal não encontrado"));

        animal.mudarRebanho(rebanho);
    }


    private void validarPermissao(Usuario usuario, Rebanho rebanho) {
        if (!rebanho.getFazenda().getProdutor().getUsuario().getId()
                .equals(usuario.getId())) {
            throw new RuntimeException("Usuário não tem permissão para cadastrar animal neste rebanho");
        }
    }

}
