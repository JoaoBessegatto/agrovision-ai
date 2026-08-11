package com.agrovisionai.agrovision_ai.domain.dto.request;

import com.agrovisionai.agrovision_ai.auth.Usuario;

import java.time.LocalDate;
import java.util.UUID;

public record ProdutorRequestDTO(
    String nomeCompleto,
    String cpfOrCnpj,
    LocalDate dataNascimento,
    String telefone
) {
}
