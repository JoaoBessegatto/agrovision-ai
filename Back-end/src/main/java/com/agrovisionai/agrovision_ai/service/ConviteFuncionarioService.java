package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.auth.CurrentUserProvider;
import com.agrovisionai.agrovision_ai.auth.Role;
import com.agrovisionai.agrovision_ai.auth.Usuario;
import com.agrovisionai.agrovision_ai.auth.UsuarioRepository;
import com.agrovisionai.agrovision_ai.domain.dto.request.CadastroFuncionarioPorConviteRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.request.ConviteFuncionarioRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.ConviteFuncionarioPublicoResponseDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.ConviteFuncionarioResponseDTO;
import com.agrovisionai.agrovision_ai.domain.entity.ConviteFuncionario;
import com.agrovisionai.agrovision_ai.domain.entity.Fazenda;
import com.agrovisionai.agrovision_ai.domain.entity.Funcionario;
import com.agrovisionai.agrovision_ai.domain.enums.StatusConviteFuncionario;
import com.agrovisionai.agrovision_ai.exception.BusinessException;
import com.agrovisionai.agrovision_ai.exception.ResouceNotFoundException;
import com.agrovisionai.agrovision_ai.exception.UnauthorizedException;
import com.agrovisionai.agrovision_ai.repository.ConviteFuncionarioRepository;
import com.agrovisionai.agrovision_ai.repository.FuncionarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ConviteFuncionarioService {

    private static final long HORAS_VALIDADE = 72;

    private final ConviteFuncionarioRepository conviteRepository;
    private final FuncionarioRepository funcionarioRepository;
    private final UsuarioRepository usuarioRepository;
    private final FazendaAccessService fazendaAccessService;
    private final CurrentUserProvider currentUserProvider;
    private final ConviteTokenService tokenService;
    private final ConviteFuncionarioEmailService emailService;
    private final PasswordEncoder passwordEncoder;

    public ConviteFuncionarioService(
            ConviteFuncionarioRepository conviteRepository,
            FuncionarioRepository funcionarioRepository,
            UsuarioRepository usuarioRepository,
            FazendaAccessService fazendaAccessService,
            CurrentUserProvider currentUserProvider,
            ConviteTokenService tokenService,
            ConviteFuncionarioEmailService emailService,
            PasswordEncoder passwordEncoder
    ) {
        this.conviteRepository = conviteRepository;
        this.funcionarioRepository = funcionarioRepository;
        this.usuarioRepository = usuarioRepository;
        this.fazendaAccessService = fazendaAccessService;
        this.currentUserProvider = currentUserProvider;
        this.tokenService = tokenService;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
    }

    public ConviteFuncionarioResponseDTO convidar(ConviteFuncionarioRequestDTO dto) {
        Fazenda fazenda = fazendaAccessService.exigirProprietario(dto.fazendaId());
        Usuario responsavel = currentUserProvider.getUsuarioAtual();
        String email = normalizarEmail(dto.email());

        if (responsavel.getEmail().equalsIgnoreCase(email)) {
            throw new BusinessException(
                    "O produtor não pode convidar a própria conta como funcionário."
            );
        }

        usuarioRepository.findByEmailIgnoreCase(email)
                .ifPresent(usuario -> {
                    if (funcionarioRepository.existsByUsuarioIdAndFazendaId(
                            usuario.getId(),
                            fazenda.getId()
                    )) {
                        throw new BusinessException(
                                "Este usuário já possui vínculo com esta fazenda."
                        );
                    }
                });

        conviteRepository
                .findFirstByEmailIgnoreCaseAndFazendaIdAndStatusOrderByCriadoEmDesc(
                        email,
                        fazenda.getId(),
                        StatusConviteFuncionario.PENDENTE
                )
                .filter(ConviteFuncionario::podeSerAceito)
                .ifPresent(convite -> {
                    throw new BusinessException(
                            "Já existe um convite pendente para este e-mail nesta fazenda."
                    );
                });

        String token = tokenService.gerarToken();

        ConviteFuncionario convite = new ConviteFuncionario(
                email,
                fazenda,
                dto.cargo(),
                responsavel,
                tokenService.hash(token),
                LocalDateTime.now().plusHours(HORAS_VALIDADE)
        );

        conviteRepository.save(convite);
        emailService.enviar(convite, token);

        return ConviteFuncionarioResponseDTO.from(convite);
    }

    @Transactional(readOnly = true)
    public List<ConviteFuncionarioResponseDTO> listarPorFazenda(UUID fazendaId) {
        fazendaAccessService.exigirProprietario(fazendaId);

        return conviteRepository
                .findByFazendaIdOrderByCriadoEmDesc(fazendaId)
                .stream()
                .map(ConviteFuncionarioResponseDTO::from)
                .toList();
    }

    public ConviteFuncionarioResponseDTO reenviar(UUID conviteId) {
        ConviteFuncionario convite = buscarConvite(conviteId);
        fazendaAccessService.exigirProprietario(convite.getFazenda().getId());

        String token = tokenService.gerarToken();

        convite.renovar(
                tokenService.hash(token),
                LocalDateTime.now().plusHours(HORAS_VALIDADE)
        );

        emailService.enviar(convite, token);

        return ConviteFuncionarioResponseDTO.from(convite);
    }

    public void cancelar(UUID conviteId) {
        ConviteFuncionario convite = buscarConvite(conviteId);
        fazendaAccessService.exigirProprietario(convite.getFazenda().getId());
        convite.cancelar();
    }

    @Transactional(readOnly = true)
    public ConviteFuncionarioPublicoResponseDTO consultarPublico(String token) {
        ConviteFuncionario convite = buscarPorToken(token);

        if (!convite.podeSerAceito()) {
            throw new BusinessException(
                    "Este convite expirou, foi cancelado ou já foi utilizado."
            );
        }

        return ConviteFuncionarioPublicoResponseDTO.from(
                convite,
                usuarioRepository.existsByEmailIgnoreCase(convite.getEmail())
        );
    }

    public void aceitarUsuarioExistente(String token) {
        ConviteFuncionario convite = buscarPorToken(token);

        if (!convite.podeSerAceito()) {
            throw new BusinessException(
                    "Este convite expirou, foi cancelado ou já foi utilizado."
            );
        }

        Usuario usuario = currentUserProvider.getUsuarioAtual();

        if (!usuario.getEmail().equalsIgnoreCase(convite.getEmail())) {
            throw new UnauthorizedException(
                    "Este convite foi enviado para outro endereço de e-mail."
            );
        }

        vincular(convite, usuario);
    }

    public void cadastrarEAceitar(CadastroFuncionarioPorConviteRequestDTO dto) {
        ConviteFuncionario convite = buscarPorToken(dto.token());

        if (!convite.podeSerAceito()) {
            throw new BusinessException(
                    "Este convite expirou, foi cancelado ou já foi utilizado."
            );
        }

        if (usuarioRepository.existsByEmailIgnoreCase(convite.getEmail())) {
            throw new BusinessException(
                    "Já existe uma conta para este e-mail. Faça login para aceitar o convite."
            );
        }

        Usuario usuario = new Usuario(
                null,
                dto.name().trim(),
                convite.getEmail(),
                passwordEncoder.encode(dto.password()),
                Role.USER
        );

        usuarioRepository.save(usuario);

        vincular(convite, usuario);
    }

    private void vincular(
            ConviteFuncionario convite,
            Usuario usuario
    ) {
        if (funcionarioRepository.existsByUsuarioIdAndFazendaId(
                usuario.getId(),
                convite.getFazenda().getId()
        )) {
            throw new BusinessException(
                    "Este usuário já possui vínculo com esta fazenda."
            );
        }

        Funcionario funcionario = new Funcionario(
                usuario,
                convite.getFazenda(),
                convite.getCargo()
        );

        funcionarioRepository.save(funcionario);
        convite.aceitar();
    }

    private ConviteFuncionario buscarConvite(UUID conviteId) {
        return conviteRepository.findById(conviteId)
                .orElseThrow(() ->
                        new ResouceNotFoundException("Convite não encontrado.")
                );
    }

    private ConviteFuncionario buscarPorToken(String token) {
        return conviteRepository.findByTokenHash(tokenService.hash(token))
                .orElseThrow(() ->
                        new ResouceNotFoundException("Convite não encontrado.")
                );
    }

    private String normalizarEmail(String email) {
        return email.trim().toLowerCase();
    }
}
