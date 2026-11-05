package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.auth.CurrentUserProvider;
import com.agrovisionai.agrovision_ai.auth.Usuario;
import com.agrovisionai.agrovision_ai.domain.dto.request.RebanhoRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.RebanhoResponseDTO;
import com.agrovisionai.agrovision_ai.domain.entity.Fazenda;
import com.agrovisionai.agrovision_ai.domain.entity.Rebanho;
import com.agrovisionai.agrovision_ai.exception.BusinessException;
import com.agrovisionai.agrovision_ai.exception.ResouceNotFoundException;
import com.agrovisionai.agrovision_ai.exception.UnauthorizedException;
import com.agrovisionai.agrovision_ai.repository.FazendaRepository;
import com.agrovisionai.agrovision_ai.repository.RebanhoRepository;
import com.agrovisionai.agrovision_ai.domain.dto.response.VendaRebanhoResponseDTO;
import com.agrovisionai.agrovision_ai.domain.entity.Animal;
import com.agrovisionai.agrovision_ai.domain.enums.SituacaoAnimal;
import com.agrovisionai.agrovision_ai.repository.AnimalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class RebanhoService {

    private final RebanhoRepository rebanhoRepository;
    private final CurrentUserProvider currentUserProvider;
    private final FazendaRepository fazendaRepository;
    private final AnimalRepository animalRepository;


    public RebanhoService(
            RebanhoRepository rebanhoRepository,
            CurrentUserProvider currentUserProvider,
            FazendaRepository fazendaRepository,
            AnimalRepository animalRepository
    ) {
        this.rebanhoRepository = rebanhoRepository;
        this.currentUserProvider = currentUserProvider;
        this.fazendaRepository = fazendaRepository;
        this.animalRepository = animalRepository;
    }


    @Transactional
    public RebanhoResponseDTO cadastrar(
            RebanhoRequestDTO dto
    ) {

        Fazenda fazenda =
                getFazendaAutorizada(
                        dto.fazendaId()
                );

        Rebanho rebanho =
                new Rebanho(
                        dto.nome(),
                        dto.descricao(),
                        fazenda
                );

        Rebanho rebanhoSalvo =
                rebanhoRepository.save(rebanho);

        return RebanhoResponseDTO.from(
                rebanhoSalvo
        );
    }

    @Transactional
    public VendaRebanhoResponseDTO venderRebanho(
            UUID rebanhoId
    ) {

        Rebanho rebanho =
                getRebanhoAutorizado(
                        rebanhoId
                );


        List<Animal> animais =
                animalRepository
                        .findByRebanhoId(
                                rebanhoId
                        );


        if (animais.isEmpty()) {

            throw new BusinessException(
                    "Não é possível vender um rebanho sem animais."
            );
        }


        int animaisVendidos = 0;
        int jaVendidos = 0;
        int mortosIgnorados = 0;


        for (Animal animal : animais) {

            if (
                    animal.getSituacao()
                            == SituacaoAnimal.MORTO
            ) {

                mortosIgnorados++;
                continue;
            }


            if (
                    animal.getSituacao()
                            == SituacaoAnimal.VENDIDO
            ) {

                jaVendidos++;
                continue;
            }


            animal.marcarComoVendido();

            animaisVendidos++;
        }


        if (animaisVendidos == 0) {

            throw new BusinessException(
                    "Este rebanho não possui animais disponíveis para venda."
            );
        }


        return new VendaRebanhoResponseDTO(
                rebanho.getId(),
                rebanho.getNome(),
                animais.size(),
                animaisVendidos,
                jaVendidos,
                mortosIgnorados
        );
    }

    @Transactional(readOnly = true)
    public List<RebanhoResponseDTO> listarPorFazenda(
            UUID fazendaId
    ) {

        getFazendaAutorizada(fazendaId);


        return rebanhoRepository
                .findByFazendaIdOrderByNomeAsc(
                        fazendaId
                )
                .stream()
                .map(RebanhoResponseDTO::from)
                .toList();
    }


    @Transactional(readOnly = true)
    public RebanhoResponseDTO buscarPorId(
            UUID rebanhoId
    ) {

        Rebanho rebanho =
                getRebanhoAutorizado(
                        rebanhoId
                );

        return RebanhoResponseDTO.from(
                rebanho
        );
    }

    @Transactional
    public RebanhoResponseDTO atualizar(
            UUID rebanhoId,
            RebanhoRequestDTO dto
    ) {

        Rebanho rebanho =
                getRebanhoAutorizado(
                        rebanhoId
                );


        if (
                !rebanho
                        .getFazenda()
                        .getId()
                        .equals(dto.fazendaId())
        ) {

            throw new BusinessException(
                    "A fazenda informada não corresponde à fazenda do rebanho."
            );
        }


        rebanho.atualizar(
                dto.nome(),
                dto.descricao()
        );


        return RebanhoResponseDTO.from(
                rebanho
        );
    }


    @Transactional
    public void deletar(
            UUID rebanhoId
    ) {

        Rebanho rebanho =
                getRebanhoAutorizado(
                        rebanhoId
                );

        if (
                rebanho.getQuantidadeAnimais() > 0
        ) {

            throw new BusinessException(
                    "Não é possível excluir um rebanho que possui animais cadastrados."
            );
        }


        rebanhoRepository.delete(
                rebanho
        );
    }

    private Fazenda getFazendaAutorizada(
            UUID fazendaId
    ) {

        Usuario usuarioLogado =
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
                usuarioLogado,
                fazenda
        );


        return fazenda;
    }


    private Rebanho getRebanhoAutorizado(
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


        Usuario usuarioLogado =
                currentUserProvider
                        .getUsuarioAtual();


        validarPermissao(
                usuarioLogado,
                rebanho.getFazenda()
        );


        return rebanho;
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
                    "Você não possui acesso a esta fazenda."
            );
        }
    }
}