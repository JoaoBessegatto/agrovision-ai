package com.agrovisionai.agrovision_ai.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
public class LoginResponseDTO {
    private String token;
    private Long userId;
    private String username;
    private String role;

}
