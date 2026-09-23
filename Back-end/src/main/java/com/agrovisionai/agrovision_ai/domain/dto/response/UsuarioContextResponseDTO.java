package com.agrovisionai.agrovision_ai.domain.dto.response;

import java.util.UUID;

public record UsuarioContextResponseDTO(
        UUID userId,
        String name,
        String email,
        boolean admin,
        boolean possuiPerfilProdutor,
        boolean possuiFazenda
) {
}