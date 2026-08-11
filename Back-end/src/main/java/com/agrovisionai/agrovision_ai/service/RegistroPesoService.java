package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.auth.CurrentUserProvider;
import com.agrovisionai.agrovision_ai.auth.Usuario;
import com.agrovisionai.agrovision_ai.domain.dto.request.RegistroPesoRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.RegistroPesoResponseDTO;
import com.agrovisionai.agrovision_ai.domain.entity.Animal;
import com.agrovisionai.agrovision_ai.domain.entity.Fazenda;
import com.agrovisionai.agrovision_ai.domain.entity.Funcionario;
import com.agrovisionai.agrovision_ai.domain.entity.RegistroPeso;
import com.agrovisionai.agrovision_ai.exception.BusinessException;
import com.agrovisionai.agrovision_ai.exception.ResouceNotFoundException;
import com.agrovisionai.agrovision_ai.exception.UnauthorizedException;
import com.agrovisionai.agrovision_ai.repository.AnimalRepository;
import com.agrovisionai.agrovision_ai.repository.FuncionarioRepository;
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
    private final FuncionarioRepository funcionarioRepository;
    private final CurrentUserProvider currentUserProvider;

    public RegistroPesoService(
            RegistroPesoRepository registroPesoRepository,
            AnimalRepository animalRepository,
            FuncionarioRepository funcionarioRepository,
            CurrentUserProvider currentUserProvider
    ) {
        this.registroPesoRepository = registroPesoRepository;
        this.animalRepository = animalRepository;
        this.funcionarioRepository = funcionarioRepository;
        this.currentUserProvider = currentUserProvider;
    }

    public RegistroPesoResponseDTO registrarPeso(
            UUID animalId,
            RegistroPesoRequestDTO dto
    ) {

        Usuario usuarioLogado = currentUserProvider.getUsuarioAtual();

        Animal animal = buscarAnimal(animalId);

        Funcionario funcionario = buscarFuncionario(
                usuarioLogado.getId(),
                animal.getRebanho().getFazenda().getId()
        );

        if (!funcionario.podeRegistrarPeso()) {
            throw new UnauthorizedException(
                    "Funcionário não possui permissão para registrar pesagens."
            );
        }

        RegistroPeso registro = new RegistroPeso(
                animal,
                usuarioLogado,
                dto.pesoKg()
        );

        registroPesoRepository.save(registro);
        animal.atualizarPeso(dto.pesoKg());

        return RegistroPesoResponseDTO.from(registro);
    }

    @Transactional(readOnly = true)
    public List<RegistroPesoResponseDTO> listarHistorico(UUID animalId) {

        buscarAnimal(animalId);

        return registroPesoRepository
                .findByAnimalIdOrderByDataRegistroDesc(animalId)
                .stream()
                .map(RegistroPesoResponseDTO::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public RegistroPesoResponseDTO buscarUltimoRegistro(UUID animalId) {

        RegistroPeso registro = registroPesoRepository
                .findTopByAnimalIdOrderByDataRegistroDesc(animalId)
                .orElseThrow(() ->
                        new ResouceNotFoundException(
                                "Animal ainda não possui pesagens."
                        ));

        return RegistroPesoResponseDTO.from(registro);
    }

    private Animal buscarAnimal(UUID id) {

        return animalRepository.findById(id)
                .orElseThrow(() ->
                        new ResouceNotFoundException("Animal não encontrado."));
    }

    private Funcionario buscarFuncionario(
            UUID usuarioId,
            UUID fazendaId
    ) {

        return funcionarioRepository
                .findByUsuarioIdAndFazendaId(usuarioId, fazendaId)
                .orElseThrow(() ->
                        new UnauthorizedException(
                                "Usuário não pertence à fazenda."
                        ));
    }

}