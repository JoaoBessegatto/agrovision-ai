package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.auth.CurrentUserProvider;
import com.agrovisionai.agrovision_ai.auth.Usuario;
import com.agrovisionai.agrovision_ai.auth.UsuarioRepository;
import com.agrovisionai.agrovision_ai.domain.dto.request.FuncionarioRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.FuncionarioResponseDTO;
import com.agrovisionai.agrovision_ai.domain.entity.Fazenda;
import com.agrovisionai.agrovision_ai.domain.entity.Funcionario;
import com.agrovisionai.agrovision_ai.exception.BusinessException;
import com.agrovisionai.agrovision_ai.exception.ResouceNotFoundException;
import com.agrovisionai.agrovision_ai.exception.UnauthorizedException;
import com.agrovisionai.agrovision_ai.repository.FazendaRepository;
import com.agrovisionai.agrovision_ai.repository.FuncionarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class FuncionarioService {
    private final FuncionarioRepository funcionarioRepository;
    private final CurrentUserProvider currentUserProvidern;
    private final UsuarioRepository usuarioRepository;
    private final FazendaRepository fazendaRepository;

    public FuncionarioService(FuncionarioRepository funcionarioRepository, CurrentUserProvider currentUserProvidern, UsuarioRepository usuarioRepository, FazendaRepository fazendaRepository) {
        this.funcionarioRepository = funcionarioRepository;
        this.currentUserProvidern = currentUserProvidern;
        this.usuarioRepository = usuarioRepository;
        this.fazendaRepository = fazendaRepository;
    }

    public FuncionarioResponseDTO cadastrar(FuncionarioRequestDTO dto){
        Usuario usuarioLogado = currentUserProvidern.getUsuarioAtual();

        Fazenda fazenda = fazendaRepository.findById(dto.fazendaId())
                .orElseThrow(() -> new ResouceNotFoundException("Fazenda não encontrada"));

        validarPermissaoProdutor(usuarioLogado,fazenda);

        Usuario usuarioFuncionario = usuarioRepository.findById(dto.usuarioId())
                .orElseThrow(() -> new ResouceNotFoundException("Usuario nÃo encontrado"));

        if(funcionarioRepository.existsByUsuarioIdAndFazendaId(usuarioFuncionario.getId(),fazenda.getId())){
            throw new BusinessException("Ja Existe esse funcionario nessa fazenda");
        }
        Funcionario funcionario = new Funcionario(
                usuarioFuncionario,
                fazenda,
                dto.cargo()
        );
        return FuncionarioResponseDTO.from(funcionario);
    }

    private void validarPermissaoProdutor(Usuario usuario, Fazenda fazenda) {
        if (!fazenda.getProdutor().getUsuario().getId()
                .equals(usuario.getId())) {
            throw new UnauthorizedException("Apenas o produtor pode cadastrar funcionários");
        }
    }
}
