package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.auth.CurrentUserProvider;
import com.agrovisionai.agrovision_ai.auth.Usuario;
import com.agrovisionai.agrovision_ai.domain.dto.response.RebanhoResponseDTO;
import com.agrovisionai.agrovision_ai.domain.entity.Fazenda;
import com.agrovisionai.agrovision_ai.domain.entity.Rebanho;
import com.agrovisionai.agrovision_ai.repository.FazendaRepository;
import com.agrovisionai.agrovision_ai.repository.RebanhoRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class RebanhoService {
    private final RebanhoRepository rebanhoRepository;
    private final CurrentUserProvider currentUserProvider;
    private final FazendaRepository fazendaRepository;

    public RebanhoService(RebanhoRepository rebanhoRepository, CurrentUserProvider currentUserProvider, FazendaRepository fazendaRepository) {
        this.rebanhoRepository = rebanhoRepository;
        this.currentUserProvider = currentUserProvider;
        this.fazendaRepository = fazendaRepository;
    }

    public RebanhoResponseDTO cadastrar(RebanhoResponseDTO dto){
        Usuario usuarioLogado = currentUserProvider.getUsuarioAtual();

        Fazenda fazenda = fazendaRepository.findById(dto.fazendaId())
                .orElseThrow(() -> new RuntimeException("Fazenda não encontrada"));
        validarPermissao(usuarioLogado,fazenda);

        Rebanho rebanho = new Rebanho(dto.nome(), dto.descricao(), fazenda);
        rebanhoRepository.save(rebanho);

        return RebanhoResponseDTO.from(rebanho);
    }

    public List<RebanhoResponseDTO> listarPorFazenda(UUID fazendaId) {

        Usuario usuario = currentUserProvider.getUsuarioAtual();

        List<Rebanho> rebanhos =
                rebanhoRepository.findByFazendaId(fazendaId);

        return rebanhos.stream()
                .map(RebanhoResponseDTO::from)
                .toList();
    }





    // aqui depois posso criar uma regra de permissao melhor
    private void validarPermissao(Usuario usuario, Fazenda fazenda) {
        if (!fazenda.getProdutor().getUsuario().getId()
                .equals(usuario.getId())) {
            throw new RuntimeException("Acesso negado");
        }
    }
}
