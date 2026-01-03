package com.agrovisionai.agrovision_ai.auth;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import static com.agrovisionai.agrovision_ai.auth.Role.ADMIN;
import static com.agrovisionai.agrovision_ai.auth.Role.PRODUTOR;

@RestController
@RequestMapping("api/auth")
@CrossOrigin("*")
public class LoginController {
    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private LoginService loginService;

    @PostMapping("/login")
    public ResponseEntity<?> logar(@RequestBody @Valid Login login){
        try {
            LoginResponseDTO response = loginService.login(login);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }
    @PostMapping("/cadastrar")
    public ResponseEntity<?> cadastrar(@RequestBody @Valid UsuarioResquest dto){
        if(usuarioRepository.existsByEmail(dto.email())){
            return ResponseEntity.badRequest().build();
        }
        String encryptedPassword = new BCryptPasswordEncoder().encode(dto.password());

        Usuario newUser = new Usuario(null,
                dto.name(),
                dto.email(),
                encryptedPassword,
                PRODUTOR);

        usuarioRepository.save(newUser);
        return ResponseEntity.ok().build();
    }
    @PostMapping("/cadastrar-admin")
    public ResponseEntity<?> cadastrarAdmin(@RequestBody @Valid UsuarioResquest dto){
        if(usuarioRepository.existsByEmail(dto.email())){
            return ResponseEntity.badRequest().build();
        }
        String encryptedPassword = new BCryptPasswordEncoder().encode(dto.password());

        Usuario newUser = new Usuario(null,
                dto.name(),
                dto.email(),
                encryptedPassword,
                ADMIN);

        usuarioRepository.save(newUser);
        return ResponseEntity.ok().build();
    }

}
