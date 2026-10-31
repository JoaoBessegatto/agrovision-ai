package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.auth.CurrentUserProvider;
import com.agrovisionai.agrovision_ai.auth.Usuario;
import com.agrovisionai.agrovision_ai.domain.dto.request.RegistroPesoRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.RegistroPesoResponseDTO;
import com.agrovisionai.agrovision_ai.domain.entity.Animal;
import com.agrovisionai.agrovision_ai.domain.entity.Fazenda;
import com.agrovisionai.agrovision_ai.domain.entity.RegistroPeso;
import com.agrovisionai.agrovision_ai.domain.enums.SituacaoAnimal;
import com.agrovisionai.agrovision_ai.exception.BusinessException;
import com.agrovisionai.agrovision_ai.exception.ResouceNotFoundException;
import com.agrovisionai.agrovision_ai.exception.UnauthorizedException;
import com.agrovisionai.agrovision_ai.repository.AnimalRepository;
import com.agrovisionai.agrovision_ai.repository.RegistroPesoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.agrovisionai.agrovision_ai.repository.FazendaRepository;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class RegistroPesoService {

    private final RegistroPesoRepository
            registroPesoRepository;

    private final AnimalRepository
            animalRepository;

    private final CurrentUserProvider
            currentUserProvider;
    private final FazendaRepository fazendaRepository;

    public RegistroPesoService(
            RegistroPesoRepository registroPesoRepository,
            AnimalRepository animalRepository,
            CurrentUserProvider currentUserProvider,
            FazendaRepository fazendaRepository
    ) {

        this.registroPesoRepository =
                registroPesoRepository;

        this.animalRepository =
                animalRepository;

        this.currentUserProvider =
                currentUserProvider;
        this.fazendaRepository =
                fazendaRepository;
    }


    public RegistroPesoResponseDTO registrar(
            UUID animalId,
            RegistroPesoRequestDTO dto
    ) {

        Usuario usuario =
                currentUserProvider
                        .getUsuarioAtual();


        Animal animal =
                buscarAnimal(
                        animalId
                );


        validarPermissao(
                usuario,
                animal.getRebanho()
                        .getFazenda()
        );


        validarAnimalParaPesagem(
                animal
        );


        validarPeso(
                dto.pesoKg()
        );


        RegistroPeso registro =
                new RegistroPeso(
                        animal,
                        usuario,
                        dto.pesoKg()
                );


        registroPesoRepository
                .save(registro);


        /*
         * Atualiza o snapshot de peso
         * atual do animal.
         */
        animal.atualizarPeso(
                dto.pesoKg()
        );


        return RegistroPesoResponseDTO
                .from(registro);
    }
    @Transactional(readOnly = true)
    public List<RegistroPesoResponseDTO> listarPorFazenda(
            UUID fazendaId
    ) {

        Usuario usuario =
                currentUserProvider
                        .getUsuarioAtual();


        Fazenda fazenda =
                fazendaRepository
                        .findById(fazendaId)
                        .orElseThrow(() ->
                                new ResouceNotFoundException(
                                        "Fazenda não encontrada."
                                )
                        );


        validarPermissao(
                usuario,
                fazenda
        );


        return registroPesoRepository
                .findByAnimalRebanhoFazendaIdOrderByDataRegistroDesc(
                        fazendaId
                )
                .stream()
                .map(
                        RegistroPesoResponseDTO::from
                )
                .toList();
    }

    // =========================================================
    // HISTÓRICO
    // =========================================================

    @Transactional(readOnly = true)
    public List<RegistroPesoResponseDTO> listarHistorico(
            UUID animalId
    ) {

        Usuario usuario =
                currentUserProvider
                        .getUsuarioAtual();


        Animal animal =
                buscarAnimal(
                        animalId
                );


        validarPermissao(
                usuario,
                animal.getRebanho()
                        .getFazenda()
        );


        return registroPesoRepository
                .findByAnimalIdOrderByDataRegistroDesc(
                        animalId
                )
                .stream()
                .map(
                        RegistroPesoResponseDTO::from
                )
                .toList();
    }


    // =========================================================
    // ÚLTIMA PESAGEM
    // =========================================================

    @Transactional(readOnly = true)
    public RegistroPesoResponseDTO buscarUltimaPesagem(
            UUID animalId
    ) {

        Usuario usuario =
                currentUserProvider
                        .getUsuarioAtual();


        Animal animal =
                buscarAnimal(
                        animalId
                );


        validarPermissao(
                usuario,
                animal.getRebanho()
                        .getFazenda()
        );


        RegistroPeso registro =
                registroPesoRepository
                        .findFirstByAnimalIdOrderByDataRegistroDesc(
                                animalId
                        )
                        .orElseThrow(() ->
                                new ResouceNotFoundException(
                                        "Nenhuma pesagem encontrada para este animal."
                                )
                        );


        return RegistroPesoResponseDTO
                .from(registro);
    }


    // =========================================================
    // AUXILIARES
    // =========================================================

    private Animal buscarAnimal(
            UUID animalId
    ) {

        return animalRepository
                .findById(animalId)
                .orElseThrow(() ->
                        new ResouceNotFoundException(
                                "Animal não encontrado."
                        )
                );
    }


    private void validarAnimalParaPesagem(
            Animal animal
    ) {

        if (
                animal.getSituacao()
                        != SituacaoAnimal.ATIVO
        ) {

            throw new BusinessException(
                    "Não é possível registrar pesagem para um animal inativo."
            );
        }
    }


    private void validarPeso(
            Double peso
    ) {

        if (
                peso == null ||
                        peso <= 0
        ) {

            throw new BusinessException(
                    "Peso inválido."
            );
        }


        if (peso > 1500) {

            throw new BusinessException(
                    "Peso informado está acima do limite permitido."
            );
        }
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
                        .equals(
                                usuario.getId()
                        )
        ) {

            throw new UnauthorizedException(
                    "Usuário não possui acesso a esta fazenda."
            );
        }
    }
}