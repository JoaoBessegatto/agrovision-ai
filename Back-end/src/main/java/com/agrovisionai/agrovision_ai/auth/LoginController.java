package com.agrovisionai.agrovision_ai.auth;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class LoginController {

    private final UsuarioRepository usuarioRepository;
    private final LoginService loginService;
    private final PasswordEncoder passwordEncoder;

    public LoginController(
            UsuarioRepository usuarioRepository,
            LoginService loginService,
            PasswordEncoder passwordEncoder
    ) {
        this.usuarioRepository = usuarioRepository;
        this.loginService = loginService;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<?> logar(
            @RequestBody @Valid Login login
    ) {

        try {

            LoginResponseDTO response =
                    loginService.login(login);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(e.getMessage());

        }
    }


    @PostMapping("/cadastrar")
    public ResponseEntity<?> cadastrar(
            @RequestBody @Valid UsuarioResquest dto
    ) {

        if (usuarioRepository.existsByEmail(dto.email())) {

            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body("Já existe um usuário cadastrado com este e-mail.");

        }


        String encryptedPassword =
                passwordEncoder.encode(dto.password());


        Usuario newUser = new Usuario(
                null,
                dto.name(),
                dto.email(),
                encryptedPassword,
                Role.USER
        );


        usuarioRepository.save(newUser);


        return ResponseEntity
                .status(HttpStatus.CREATED)
                .build();
    }


    @PostMapping("/cadastrar-admin")
    public ResponseEntity<?> cadastrarAdmin(
            @RequestBody @Valid UsuarioResquest dto
    ) {

        if (usuarioRepository.existsByEmail(dto.email())) {

            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body("Já existe um usuário cadastrado com este e-mail.");

        }


        String encryptedPassword =
                passwordEncoder.encode(dto.password());


        Usuario newUser = new Usuario(
                null,
                dto.name(),
                dto.email(),
                encryptedPassword,
                Role.ADMIN
        );


        usuarioRepository.save(newUser);


        return ResponseEntity
                .status(HttpStatus.CREATED)
                .build();
    }

}