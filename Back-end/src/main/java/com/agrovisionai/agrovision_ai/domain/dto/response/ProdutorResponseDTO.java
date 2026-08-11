package com.agrovisionai.agrovision_ai.domain.dto.response;

import com.agrovisionai.agrovision_ai.domain.entity.Produtor;

import java.time.LocalDate;
import java.util.UUID;

public record ProdutorResponseDTO(
        String cpfOrCnpj,
        String nomeCompleto,
        LocalDate dataNascimento,
        String telefone
        ) {
    public ProdutorResponseDTO(Produtor produtor){
        this(
                produtor.getCpfOrCnpj(),
                produtor.getNomeCompleto(),
                produtor.getDataNascimento(),
                produtor.getTelefone()
        );
    }
}
