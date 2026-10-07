package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.auth.CurrentUserProvider;
import com.agrovisionai.agrovision_ai.auth.Usuario;
import com.agrovisionai.agrovision_ai.domain.dto.request.AnimalRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.AnimalResponseDTO;
import com.agrovisionai.agrovision_ai.domain.entity.Animal;
import com.agrovisionai.agrovision_ai.domain.entity.Fazenda;
import com.agrovisionai.agrovision_ai.domain.entity.Rebanho;
import com.agrovisionai.agrovision_ai.exception.BusinessException;
import com.agrovisionai.agrovision_ai.exception.ResouceNotFoundException;
import com.agrovisionai.agrovision_ai.exception.UnauthorizedException;
import com.agrovisionai.agrovision_ai.repository.AnimalRepository;
import com.agrovisionai.agrovision_ai.repository.FazendaRepository;
import com.agrovisionai.agrovision_ai.repository.RebanhoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class AnimalService {

    private final AnimalRepository animalRepository;
    private final RebanhoRepository rebanhoRepository;
    private final FazendaRepository fazendaRepository;
    private final CurrentUserProvider currentUserProvider;

    public AnimalService(
            AnimalRepository animalRepository,
            RebanhoRepository rebanhoRepository,
            FazendaRepository fazendaRepository,
            CurrentUserProvider currentUserProvider
    ) {
        this.animalRepository = animalRepository;
        this.rebanhoRepository = rebanhoRepository;
        this.fazendaRepository = fazendaRepository;
        this.currentUserProvider = currentUserProvider;
    }


    public AnimalResponseDTO cadastrar(
            AnimalRequestDTO dto
    ) {

        Rebanho rebanho =
                buscarRebanhoAutorizado(
                        dto.rebanhoId()
                );


        if (
                animalRepository
                        .existsByIdentificacao(
                                dto.identificacao()
                        )
        ) {

            throw new BusinessException(
                    "Já existe um animal com essa identificação."
            );
        }


        Animal animal =
                new Animal(
                        dto.identificacao().trim(),
                        dto.raca().trim(),
                        dto.sexo(),
                        dto.dataNascimento(),
                        dto.pesoAtual(),
                        rebanho
                );


        Animal animalSalvo =
                animalRepository.save(animal);


        return AnimalResponseDTO.from(
                animalSalvo
        );
    }


    @Transactional(readOnly = true)
    public AnimalResponseDTO buscarPorId(
            UUID animalId
    ) {

        return AnimalResponseDTO.from(
                buscarAnimalAutorizado(
                        animalId
                )
        );
    }

    @Transactional(readOnly = true)
    public List<AnimalResponseDTO> listarPorRebanho(
            UUID rebanhoId
    ) {

        buscarRebanhoAutorizado(
                rebanhoId
        );


        return animalRepository
                .findByRebanhoId(
                        rebanhoId
                )
                .stream()
                .map(AnimalResponseDTO::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AnimalResponseDTO> listarPorFazenda(
            UUID fazendaId
    ) {

        buscarFazendaAutorizada(
                fazendaId
        );


        return animalRepository
                .findByRebanhoFazendaId(
                        fazendaId
                )
                .stream()
                .map(AnimalResponseDTO::from)
                .toList();
    }

    public void transferirAnimal(
            UUID animalId,
            UUID novoRebanhoId
    ) {

        Animal animal =
                buscarAnimalAutorizado(
                        animalId
                );


        Rebanho novoRebanho =
                buscarRebanhoAutorizado(
                        novoRebanhoId
                );


        if (
                !animal
                        .getRebanho()
                        .getFazenda()
                        .getId()
                        .equals(
                                novoRebanho
                                        .getFazenda()
                                        .getId()
                        )
        ) {

            throw new BusinessException(
                    "Não é permitido transferir animais entre fazendas diferentes."
            );
        }


        animal.mudarRebanho(
                novoRebanho
        );
    }


    public void inativar(
            UUID animalId
    ) {

        Animal animal =
                buscarAnimalAutorizado(
                        animalId
                );

        animal.inativar();
    }

    public void ativar(
            UUID animalId
    ) {

        Animal animal =
                buscarAnimalAutorizado(
                        animalId
                );

        animal.ativar();
    }

    private Animal buscarAnimalAutorizado(
            UUID animalId
    ) {

        Animal animal =
                animalRepository
                        .findById(animalId)
                        .orElseThrow(() ->
                                new ResouceNotFoundException(
                                        "Animal não encontrado."
                                )
                        );


        Usuario usuario =
                currentUserProvider
                        .getUsuarioAtual();


        validarPermissao(
                usuario,
                animal.getRebanho().getFazenda()
        );


        return animal;
    }


    private Rebanho buscarRebanhoAutorizado(
            UUID rebanhoId
    ) {

        Rebanho rebanho =
                rebanhoRepository
                        .findById(rebanhoId)
                        .orElseThrow(() ->
                                new ResouceNotFoundException(
                                        "Rebanho não encontrado."
                                )
                        );


        Usuario usuario =
                currentUserProvider
                        .getUsuarioAtual();


        validarPermissao(
                usuario,
                rebanho.getFazenda()
        );


        return rebanho;
    }


    private Fazenda buscarFazendaAutorizada(
            UUID fazendaId
    ) {

        Fazenda fazenda =
                fazendaRepository
                        .findById(fazendaId)
                        .orElseThrow(() ->
                                new ResouceNotFoundException(
                                        "Fazenda não encontrada."
                                )
                        );


        Usuario usuario =
                currentUserProvider
                        .getUsuarioAtual();


        validarPermissao(
                usuario,
                fazenda
        );


        return fazenda;
    }


    private void validarPermissao(
            Usuario usuario,
            Fazenda fazenda
    ) {

        if (
                !fazenda
                        .getProdutor()
                        .getUsuario()
                        .getId()
                        .equals(usuario.getId())
        ) {

            throw new UnauthorizedException(
                    "Usuário não possui acesso a esta fazenda."
            );
        }
    }
}