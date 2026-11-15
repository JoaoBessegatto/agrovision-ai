package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.auth.CurrentUserProvider;
import com.agrovisionai.agrovision_ai.auth.Usuario;
import com.agrovisionai.agrovision_ai.domain.dto.request.AnimalRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.AnimalResponseDTO;
import com.agrovisionai.agrovision_ai.domain.entity.Animal;
import com.agrovisionai.agrovision_ai.domain.entity.Rebanho;
import com.agrovisionai.agrovision_ai.domain.entity.RegistroPeso;
import com.agrovisionai.agrovision_ai.domain.enums.PermissaoFuncionario;
import com.agrovisionai.agrovision_ai.exception.BusinessException;
import com.agrovisionai.agrovision_ai.exception.ResouceNotFoundException;
import com.agrovisionai.agrovision_ai.repository.AnimalRepository;
import com.agrovisionai.agrovision_ai.repository.RebanhoRepository;
import com.agrovisionai.agrovision_ai.repository.RegistroPesoRepository;
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
    private final RegistroPesoRepository registroPesoRepository;
    private final FazendaAccessService fazendaAccessService;

    public AnimalService(
            AnimalRepository animalRepository,
            RebanhoRepository rebanhoRepository,
            CurrentUserProvider currentUserProvider,
            RegistroPesoRepository registroPesoRepository,
            FazendaAccessService fazendaAccessService
    ) {
        this.animalRepository = animalRepository;
        this.rebanhoRepository = rebanhoRepository;
        this.currentUserProvider = currentUserProvider;
        this.registroPesoRepository = registroPesoRepository;
        this.fazendaAccessService = fazendaAccessService;
    }

    public AnimalResponseDTO cadastrar(AnimalRequestDTO dto) {

        Usuario usuario =
                currentUserProvider.getUsuarioAtual();

        Rebanho rebanho =
                buscarRebanho(dto.rebanhoId());

        fazendaAccessService.exigirPermissao(
                rebanho.getFazenda().getId(),
                PermissaoFuncionario.CADASTRAR_ANIMAL
        );

        String identificacao =
                dto.identificacao()
                        .trim()
                        .toUpperCase();

        if (animalRepository
                .existsByIdentificacaoIgnoreCaseAndRebanhoFazendaId(
                        identificacao,
                        rebanho.getFazenda().getId()
                )) {
            throw new BusinessException(
                    "Já existe um animal com essa identificação nesta fazenda."
            );
        }

        Animal animal =
                new Animal(
                        identificacao,
                        dto.raca().trim(),
                        dto.sexo(),
                        dto.dataNascimento(),
                        dto.pesoAtual(),
                        rebanho
                );

        Animal animalSalvo =
                animalRepository.save(animal);

        RegistroPeso registroPesoInicial =
                new RegistroPeso(
                        animalSalvo,
                        usuario,
                        dto.pesoAtual()
                );

        registroPesoRepository.save(registroPesoInicial);

        return AnimalResponseDTO.from(animalSalvo);
    }

    @Transactional(readOnly = true)
    public AnimalResponseDTO buscarPorId(UUID animalId) {

        Animal animal = buscarAnimal(animalId);

        fazendaAccessService.exigirVisualizacao(
                animal.getRebanho().getFazenda().getId()
        );

        return AnimalResponseDTO.from(animal);
    }

    @Transactional(readOnly = true)
    public AnimalResponseDTO buscarPorIdentificacao(
            UUID fazendaId,
            String identificacao
    ) {
        fazendaAccessService.exigirVisualizacao(fazendaId);

        if (identificacao == null || identificacao.isBlank()) {
            throw new BusinessException(
                    "Identificação do animal é obrigatória."
            );
        }

        String identificacaoNormalizada =
                identificacao.trim().toUpperCase();

        Animal animal =
                animalRepository
                        .findByIdentificacaoIgnoreCaseAndRebanhoFazendaId(
                                identificacaoNormalizada,
                                fazendaId
                        )
                        .orElseThrow(() ->
                                new ResouceNotFoundException(
                                        "Animal não encontrado nesta fazenda."
                                )
                        );

        return AnimalResponseDTO.from(animal);
    }

    @Transactional(readOnly = true)
    public List<AnimalResponseDTO> listarPorRebanho(UUID rebanhoId) {

        Rebanho rebanho = buscarRebanho(rebanhoId);

        fazendaAccessService.exigirVisualizacao(
                rebanho.getFazenda().getId()
        );

        return animalRepository
                .findByRebanhoId(rebanhoId)
                .stream()
                .map(AnimalResponseDTO::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AnimalResponseDTO> listarPorFazenda(UUID fazendaId) {

        fazendaAccessService.exigirVisualizacao(fazendaId);

        return animalRepository
                .findByRebanhoFazendaId(fazendaId)
                .stream()
                .map(AnimalResponseDTO::from)
                .toList();
    }

    public void transferirAnimal(
            UUID animalId,
            UUID novoRebanhoId
    ) {
        Animal animal = buscarAnimal(animalId);

        UUID fazendaId =
                animal.getRebanho()
                        .getFazenda()
                        .getId();

        fazendaAccessService.exigirPermissao(
                fazendaId,
                PermissaoFuncionario.TRANSFERIR_ANIMAL
        );

        Rebanho novoRebanho =
                buscarRebanho(novoRebanhoId);

        if (!fazendaId.equals(
                novoRebanho.getFazenda().getId()
        )) {
            throw new BusinessException(
                    "Não é permitido transferir animais entre fazendas diferentes."
            );
        }

        animal.mudarRebanho(novoRebanho);
    }

    public void inativar(UUID animalId) {

        Animal animal = buscarAnimal(animalId);

        fazendaAccessService.exigirPermissao(
                animal.getRebanho().getFazenda().getId(),
                PermissaoFuncionario.ALTERAR_SITUACAO_ANIMAL
        );

        animal.inativar();
    }

    public void ativar(UUID animalId) {

        Animal animal = buscarAnimal(animalId);

        fazendaAccessService.exigirPermissao(
                animal.getRebanho().getFazenda().getId(),
                PermissaoFuncionario.ALTERAR_SITUACAO_ANIMAL
        );

        animal.ativar();
    }

    public void marcarComoVendido(UUID animalId) {

        Animal animal = buscarAnimal(animalId);

        fazendaAccessService.exigirProprietario(
                animal.getRebanho().getFazenda().getId()
        );

        animal.marcarComoVendido();
    }

    public void marcarComoMorto(UUID animalId) {

        Animal animal = buscarAnimal(animalId);

        fazendaAccessService.exigirPermissao(
                animal.getRebanho().getFazenda().getId(),
                PermissaoFuncionario.REGISTRAR_MORTE
        );

        animal.marcarComoMorto();
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

    private Rebanho buscarRebanho(UUID rebanhoId) {
        return rebanhoRepository
                .findById(rebanhoId)
                .orElseThrow(() ->
                        new ResouceNotFoundException(
                                "Rebanho não encontrado."
                        )
                );
    }
}
