package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.auth.Role;
import com.agrovisionai.agrovision_ai.auth.Usuario;
import com.agrovisionai.agrovision_ai.domain.dto.request.FazendaRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.FazendaResponseDTO;
import com.agrovisionai.agrovision_ai.domain.entity.Fazenda;
import com.agrovisionai.agrovision_ai.domain.entity.Produtor;
import com.agrovisionai.agrovision_ai.domain.enums.TipoExploracao;
import com.agrovisionai.agrovision_ai.repository.FazendaRepository;
import com.agrovisionai.agrovision_ai.repository.ProdutorRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class FazendaService {
    private final FazendaRepository fazendaRepository;
    private final ProdutorRepository produtorRepository;

    public FazendaService(FazendaRepository fazendaRepository, ProdutorRepository produtorRepository) {
        this.fazendaRepository = fazendaRepository;
        this.produtorRepository = produtorRepository;
    }

    public FazendaResponseDTO salvar(FazendaRequestDTO dto){
        Usuario usuarioLogado = (Usuario) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
        if(usuarioLogado.getRole() != Role.PRODUTOR){
            throw new RuntimeException("Usuário autenticado não é PRODUTOR");
        }

        Produtor produtor = produtorRepository.findByUsuario(usuarioLogado)
                .orElseThrow(() -> new RuntimeException("Produtor não encontrado para o usuário autenticado"));


        Fazenda fazenda = new Fazenda();
        fazenda.setNome(dto.nome());
        fazenda.setCidade(dto.cidade());
        fazenda.setEstado(dto.estado());
        fazenda.setLatitude(dto.latitude());
        fazenda.setLongitude(dto.longitude());
        fazenda.setAreaTotalHa(dto.areaTotalHa());
        fazenda.setExploracao(TipoExploracao.valueOf(dto.exploracao()));
        fazenda.setGeopoligono(dto.geopoligono());
        fazenda.setProdutor(produtor);

        Fazenda FazendaSalva = fazendaRepository.save(fazenda);

        return new FazendaResponseDTO(FazendaSalva);
    }
    public FazendaResponseDTO atualizar(FazendaRequestDTO dto){
        Usuario usuarioLogado = (Usuario) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
        if(usuarioLogado.getRole() != Role.PRODUTOR){
            throw new RuntimeException("Usuario autenticado não é Produtor");
        }

        Produtor produtor = produtorRepository.findByUsuario(usuarioLogado)
                .orElseThrow(() -> new RuntimeException("O Usuario precisa ter cadastro de produtor"));

        Fazenda fazenda = fazendaRepository.findByIdAndProdutor(dto.id(),produtor)
                .orElseThrow(() -> new RuntimeException("Fazenda não encontrada para esse produtor"));

        fazenda.setNome(dto.nome());
        fazenda.setCidade(dto.cidade());
        fazenda.setEstado(dto.estado());
        fazenda.setLatitude(dto.latitude());
        fazenda.setLongitude(dto.longitude());
        fazenda.setAreaTotalHa(dto.areaTotalHa());
        fazenda.setExploracao(TipoExploracao.valueOf(dto.exploracao()));
        fazenda.setGeopoligono(dto.geopoligono());

        Fazenda fazendaAtualizada = fazendaRepository.save(fazenda);
        return new FazendaResponseDTO(fazendaAtualizada);
    }
    public boolean deletar(UUID fazendaId){
        Usuario usuarioLogado = (Usuario) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
        if(usuarioLogado.getRole() != Role.PRODUTOR){
            throw new RuntimeException("O usuario precisa ser Produtor");
        }
        Produtor produtor = produtorRepository.findByUsuario(usuarioLogado)
                .orElseThrow(()-> new RuntimeException("Não foi possivel achar cadastro de Produtor para esse usuario logado"));

        Fazenda fazenda = fazendaRepository.findByIdAndProdutor(fazendaId,produtor)
                .orElseThrow(()-> new RuntimeException("Fazenda não encontrada para esse produtor logado"));

        fazendaRepository.delete(fazenda);
        return true;
    }
    public List<FazendaResponseDTO>getAll(){
        Usuario usuarioLogado = (Usuario) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
        if(usuarioLogado.getRole() != Role.ADMIN){
            throw new RuntimeException("O Usuario não tem permicão de ADMIN");
        }

        return fazendaRepository.findAll()
                .stream()
                .map(FazendaResponseDTO::new)
                .toList();
    }
    public FazendaResponseDTO get(UUID fazendaId){
        Usuario usuarioLogado = (Usuario) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
        if(usuarioLogado.getRole() != Role.PRODUTOR){
            throw new RuntimeException("Usuario logado precisa ser Produtor");
        }
        Produtor produtor = produtorRepository.findByUsuario(usuarioLogado)
                .orElseThrow(()-> new RuntimeException("Usuario precisa ter cadastro de Produtor"));
        Fazenda fazenda = fazendaRepository.findByIdAndProdutor(fazendaId,produtor)
                .orElseThrow(()-> new RuntimeException("Fazenda não encontrada para esse produtor"));

        return new FazendaResponseDTO(fazenda);
    }
}
