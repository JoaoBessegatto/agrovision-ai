package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.auth.CurrentUserProvider;
import com.agrovisionai.agrovision_ai.auth.Usuario;
import com.agrovisionai.agrovision_ai.domain.dto.response.DashboardResponseDTO;
import com.agrovisionai.agrovision_ai.domain.enums.SituacaoAnimal;
import com.agrovisionai.agrovision_ai.domain.entity.Fazenda;
import com.agrovisionai.agrovision_ai.exception.ResouceNotFoundException;
import com.agrovisionai.agrovision_ai.repository.AnimalRepository;
import com.agrovisionai.agrovision_ai.repository.FazendaRepository;
import com.agrovisionai.agrovision_ai.repository.FuncionarioRepository;
import com.agrovisionai.agrovision_ai.repository.RebanhoRepository;
import com.agrovisionai.agrovision_ai.repository.RegistroPesoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class DashboardService {

    private final AnimalRepository animalRepository;
    private final RebanhoRepository rebanhoRepository;
    private final FuncionarioRepository funcionarioRepository;
    private final RegistroPesoRepository registroPesoRepository;
    private final FazendaRepository fazendaRepository;
    private final CurrentUserProvider currentUserProvider;

    public DashboardService(
            AnimalRepository animalRepository,
            RebanhoRepository rebanhoRepository,
            FuncionarioRepository funcionarioRepository,
            RegistroPesoRepository registroPesoRepository,
            FazendaRepository fazendaRepository,
            CurrentUserProvider currentUserProvider
    ) {
        this.animalRepository = animalRepository;
        this.rebanhoRepository = rebanhoRepository;
        this.funcionarioRepository = funcionarioRepository;
        this.registroPesoRepository = registroPesoRepository;
        this.fazendaRepository = fazendaRepository;
        this.currentUserProvider = currentUserProvider;
    }

    @Transactional(readOnly = true)
    public DashboardResponseDTO criarDashboard() {

        Usuario usuarioLogado = currentUserProvider.getUsuarioAtual();

        Fazenda fazenda = buscarFazendaDoUsuario(usuarioLogado);

        UUID fazendaId = fazenda.getId();

        long totalAnimais =
                animalRepository.countByRebanhoFazendaId(fazendaId);

        long animaisAtivos =
                animalRepository.countByRebanhoFazendaIdAndSituacao(
                        fazendaId,
                        SituacaoAnimal.ATIVO
                );

        long animaisInativos =
                animalRepository.countByRebanhoFazendaIdAndSituacao(
                        fazendaId,
                        SituacaoAnimal.INATIVO
                );

        long totalRebanhos =
                rebanhoRepository.countByFazendaId(fazendaId);

        long totalFuncionarios =
                funcionarioRepository.countByFazendaId(fazendaId);

        Double pesoMedio =
                registroPesoRepository.buscarPesoMedio(fazendaId);

        LocalDateTime ultimaPesagem =
                registroPesoRepository.buscarUltimaPesagem(fazendaId);

        return new DashboardResponseDTO(
                totalAnimais,
                animaisAtivos,
                animaisInativos,
                totalRebanhos,
                totalFuncionarios,
                pesoMedio,
                ultimaPesagem
        );
    }

    private Fazenda buscarFazendaDoUsuario(Usuario usuario) {

        return fazendaRepository
                .findByProdutorUsuarioId(usuario.getId())
                .orElseThrow(() ->
                        new ResouceNotFoundException(
                                "Fazenda do usuário não encontrada."
                        ));
    }
}