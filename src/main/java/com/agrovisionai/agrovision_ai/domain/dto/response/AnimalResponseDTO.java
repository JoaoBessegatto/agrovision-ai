package com.agrovisionai.agrovision_ai.domain.dto.response;

import com.agrovisionai.agrovision_ai.domain.entity.Animal;
import com.agrovisionai.agrovision_ai.domain.enums.SexoAnimal;
import com.agrovisionai.agrovision_ai.domain.enums.SituacaoAnimal;

import java.time.LocalDate;
import java.util.UUID;

public record AnimalResponseDTO(
        String identificacao,
        String raca,
        SexoAnimal sexo,
        LocalDate dataNascimento,
        SituacaoAnimal situacao,
        UUID rebanhoId,
        int idadeMeses
) {
    public static AnimalResponseDTO from(Animal animal) {
        return new AnimalResponseDTO(
                animal.getIdentificacao(),
                animal.getRaca(),
                animal.getSexo(),
                animal.getDataNascimento(),
                animal.getSituacao(),
                animal.getRebanho().getId(),
                animal.getIdadeMeses()
        );
    }
}
