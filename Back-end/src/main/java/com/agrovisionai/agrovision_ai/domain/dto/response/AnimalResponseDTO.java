package com.agrovisionai.agrovision_ai.domain.dto.response;

import com.agrovisionai.agrovision_ai.domain.entity.Animal;
import com.agrovisionai.agrovision_ai.domain.enums.SexoAnimal;
import com.agrovisionai.agrovision_ai.domain.enums.SituacaoAnimal;

import java.time.LocalDate;
import java.util.UUID;

public record AnimalResponseDTO(

        UUID id,

        String identificacao,

        String raca,

        SexoAnimal sexo,

        LocalDate dataNascimento,

        SituacaoAnimal situacao,

        Double pesoAtual,

        UUID rebanhoId,

        String rebanhoNome,

        int idadeMeses

) {

    public static AnimalResponseDTO from(
            Animal animal
    ) {

        return new AnimalResponseDTO(

                animal.getId(),

                animal.getIdentificacao(),

                animal.getRaca(),

                animal.getSexo(),

                animal.getDataNascimento(),

                animal.getSituacao(),

                animal.getPesoAtual(),

                animal.getRebanho().getId(),

                animal.getRebanho().getNome(),

                animal.getIdadeMeses()
        );
    }
}