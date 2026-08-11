package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.auth.CurrentUserProvider;
import com.agrovisionai.agrovision_ai.auth.Usuario;
import com.agrovisionai.agrovision_ai.domain.dto.request.AnimalRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.AnimalResponseDTO;
import com.agrovisionai.agrovision_ai.domain.entity.Animal;
import com.agrovisionai.agrovision_ai.domain.entity.Rebanho;
import com.agrovisionai.agrovision_ai.domain.enums.SituacaoAnimal;
import com.agrovisionai.agrovision_ai.exception.BusinessException;
import com.agrovisionai.agrovision_ai.exception.ResouceNotFoundException;
import com.agrovisionai.agrovision_ai.exception.UnauthorizedException;
import com.agrovisionai.agrovision_ai.repository.AnimalRepository;
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
    private final CurrentUserProvider currentUserProvider;

    public AnimalService(
            AnimalRepository animalRepository,
            RebanhoRepository rebanhoRepository,
            CurrentUserProvider currentUserProvider
    ) {
        this.animalRepository = animalRepository;
        this.rebanhoRepository = rebanhoRepository;
        this.currentUserProvider = currentUserProvider;
    }

    public AnimalResponseDTO cadastrar(AnimalRequestDTO dto) {

        Usuario usuario = currentUserProvider.getUsuarioAtual();

        Rebanho rebanho = buscarRebanho(dto.rebanhoId());

        validarPermissao(usuario, rebanho);

        if (animalRepository.existsByIdentificacao(dto.identificacao())) {
            throw new BusinessException("Já existe um animal com essa identificação.");
        }

        Animal animal = new Animal(
                dto.identificacao(),
                dto.raca(),
                dto.sexo(),
                dto.dataNascimento(),
                dto.pesoAtual(),
                rebanho
        );

        animalRepository.save(animal);

        return AnimalResponseDTO.from(animal);
    }

    @Transactional(readOnly = true)
    public AnimalResponseDTO buscarPorId(UUID animalId) {

        return AnimalResponseDTO.from(buscarAnimal(animalId));
    }

    @Transactional(readOnly = true)
    public AnimalResponseDTO buscarPorIdentificacao(String identificacao) {

        Animal animal = animalRepository.findByIdentificacao(identificacao)
                .orElseThrow(() ->
                        new ResouceNotFoundException("Animal não encontrado."));

        return AnimalResponseDTO.from(animal);
    }

    @Transactional(readOnly = true)
    public List<AnimalResponseDTO> listarTodos() {

        return animalRepository.findAll()
                .stream()
                .map(AnimalResponseDTO::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AnimalResponseDTO> listarPorRebanho(UUID rebanhoId) {

        buscarRebanho(rebanhoId);

        return animalRepository.findByRebanhoId(rebanhoId)
                .stream()
                .map(AnimalResponseDTO::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AnimalResponseDTO> listarPorFazenda(UUID fazendaId) {

        return animalRepository.findByRebanhoFazendaId(fazendaId)
                .stream()
                .map(AnimalResponseDTO::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AnimalResponseDTO> listarAtivos() {

        return animalRepository.findBySituacao(SituacaoAnimal.ATIVO)
                .stream()
                .map(AnimalResponseDTO::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AnimalResponseDTO> listarInativos() {

        return animalRepository.findBySituacao(SituacaoAnimal.INATIVO)
                .stream()
                .map(AnimalResponseDTO::from)
                .toList();
    }

    public void transferirAnimal(UUID animalId, UUID novoRebanhoId) {

        Usuario usuario = currentUserProvider.getUsuarioAtual();

        Animal animal = buscarAnimal(animalId);

        Rebanho novoRebanho = buscarRebanho(novoRebanhoId);

        validarPermissao(usuario, novoRebanho);

        if (!animal.getRebanho()
                .getFazenda()
                .getId()
                .equals(novoRebanho.getFazenda().getId())) {

            throw new BusinessException(
                    "Não é permitido transferir animais entre fazendas diferentes."
            );
        }

        animal.mudarRebanho(novoRebanho);
    }

    public void inativar(UUID animalId) {

        Animal animal = buscarAnimal(animalId);

        animal.inativar();
    }

    public void ativar(UUID animalId) {

        Animal animal = buscarAnimal(animalId);

        animal.ativar();
    }

    // ==========================
    // Métodos privados
    // ==========================

    private Animal buscarAnimal(UUID animalId) {

        return animalRepository.findById(animalId)
                .orElseThrow(() ->
                        new ResouceNotFoundException("Animal não encontrado."));
    }

    private Rebanho buscarRebanho(UUID rebanhoId) {

        return rebanhoRepository.findById(rebanhoId)
                .orElseThrow(() ->
                        new ResouceNotFoundException("Rebanho não encontrado."));
    }

    private void validarPermissao(Usuario usuario, Rebanho rebanho) {

        if (!rebanho.getFazenda()
                .getProdutor()
                .getUsuario()
                .getId()
                .equals(usuario.getId())) {

            throw new UnauthorizedException(
                    "Usuário não possui permissão para esta fazenda."
            );
        }
    }
}