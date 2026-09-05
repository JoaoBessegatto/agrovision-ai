package com.agrovisionai.agrovision_ai.auth;

import com.agrovisionai.agrovision_ai.config.JwtServiceGenerator;
import com.agrovisionai.agrovision_ai.exception.UnauthorizedException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class LoginService {
    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private JwtServiceGenerator jwtService;

    @Autowired
    private AuthenticationManager authenticationManager;

    public LoginResponseDTO login(Login login){
        try{
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            login.getEmail(),
                            login.getPassword()
                    )
            );
            Usuario usuario = usuarioRepository.findByEmail(login.getEmail())
                    .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));
            String token = jwtService.generateToken(usuario);

            return new LoginResponseDTO(
                    token,
                    usuario.getId(),
                    usuario.getUsername(),
                    usuario.getRole().name()
            );
        }catch (AuthenticationException e){
            throw new UnauthorizedException("Usuário ou senha inválidos.");
        }
    }
}
