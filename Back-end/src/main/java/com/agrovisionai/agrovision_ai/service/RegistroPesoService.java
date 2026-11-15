package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.auth.CurrentUserProvider;
import com.agrovisionai.agrovision_ai.auth.Usuario;
import com.agrovisionai.agrovision_ai.domain.dto.request.RegistroPesoRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.RegistroPesoResponseDTO;
import com.agrovisionai.agrovision_ai.domain.entity.Animal;
import com.agrovisionai.agrovision_ai.domain.entity.RegistroPeso;
import com.agrovisionai.agrovision_ai.domain.enums.PermissaoFuncionario;
import com.agrovisionai.agrovision_ai.domain.enums.SituacaoAnimal;
import com.agrovisionai.agrovision_ai.exception.BusinessException;
import com.agrovisionai.agrovision_ai.exception.ResouceNotFoundException;
import com.agrovisionai.agrovision_ai.repository.AnimalRepository;
import com.agrovisionai.agrovision_ai.repository.RegistroPesoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class RegistroPesoService {

    private final RegistroPesoRepository registroPesoRepository;
    private final AnimalRepository animalRepository;
    private final CurrentUserProvider currentUserProvider;
    private final FazendaAccessService fazendaAccessService;

    public RegistroPesoService(
            RegistroPesoRepository registroPesoRepository,
            AnimalRepository animalRepository,
            CurrentUserProvider currentUserProvider,
            FazendaAccessService fazendaAccessService
    ) {
        this.registroPesoRepository = registroPesoRepository;
        this.animalRepository = animalRepository;
        this.currentUserProvider = currentUserProvider;
        this.fazendaAccessService = fazendaAccessService;
    }

    public RegistroPesoResponseDTO registrar(
            UUID animalId,
            RegistroPesoRequestDTO dto
    ) {
        Usuario usuario =
                currentUserProvider.getUsuarioAtual();

        Animal animal =
                buscarAnimal(animalId);

        fazendaAccessService.exigirPermissao(
                animal.getRebanho().getFazenda().getId(),
                PermissaoFuncionario.REGISTRAR_PESO
        );

        validarAnimalParaPesagem(animal);
        validarPeso(dto.pesoKg());

        RegistroPeso registro =
                new RegistroPeso(
                        animal,
                        usuario,
                        dto.pesoKg()
                );

        registroPesoRepository.save(registro);

        animal.atualizarPeso(dto.pesoKg());

        return RegistroPesoResponseDTO.from(registro);
    }

    @Transactional(readOnly = true)
    public List<RegistroPesoResponseDTO> listarPorFazenda(
            UUID fazendaId
    ) {
        fazendaAccessService.exigirVisualizacao(fazendaId);

        return registroPesoRepository
                .findByAnimalRebanhoFazendaIdOrderByDataRegistroDesc(
                        fazendaId
                )
                .stream()
                .map(RegistroPesoResponseDTO::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RegistroPesoResponseDTO> listarHistorico(
            UUID animalId
    ) {
        Animal animal = buscarAnimal(animalId);

        fazendaAccessService.exigirVisualizacao(
                animal.getRebanho().getFazenda().getId()
        );

        return registroPesoRepository
                .findByAnimalIdOrderByDataRegistroDesc(animalId)
                .stream()
                .map(RegistroPesoResponseDTO::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public RegistroPesoResponseDTO buscarUltimaPesagem(
            UUID animalId
    ) {
        Animal animal = buscarAnimal(animalId);

        fazendaAccessService.exigirVisualizacao(
                animal.getRebanho().getFazenda().getId()
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

        return RegistroPesoResponseDTO.from(registro);
    }

    private Animal buscarAnimal(UUID animalId) {
        return animalRepository
                .findById(animalId)
                .orElseThrow(() ->
                        new ResouceNotFoundException(
                                "Animal não encontrado."
                        )
                );
    }

    private void validarAnimalParaPesagem(Animal animal) {

        if (animal.getSituacao() != SituacaoAnimal.ATIVO) {
            throw new BusinessException(
                    "Não é possível registrar pesagem para um animal inativo."
            );
        }
    }

    private void validarPeso(Double peso) {

        if (peso == null || peso <= 0) {
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
}
