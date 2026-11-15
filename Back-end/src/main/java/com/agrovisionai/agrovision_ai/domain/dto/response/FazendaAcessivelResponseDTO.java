package com.agrovisionai.agrovision_ai.domain.dto.response;

import com.agrovisionai.agrovision_ai.domain.entity.Fazenda;
import com.agrovisionai.agrovision_ai.domain.entity.Funcionario;
import com.agrovisionai.agrovision_ai.domain.enums.TipoAcessoFazenda;

import java.util.List;
import java.util.UUID;

public record FazendaAcessivelResponseDTO(
        UUID id,
        String nome,
        String cidade,
        String estado,
        Double latitude,
        Double longitude,
        Double areaTotalHa,
        String exploracao,
        String geopoligono,
        String tipoAcesso,
        String cargo,
        List<String> permissoes
) {

    public static FazendaAcessivelResponseDTO proprietario(Fazenda fazenda) {
        return from(fazenda, TipoAcessoFazenda.PROPRIETARIO, null, List.of());
    }

    public static FazendaAcessivelResponseDTO admin(Fazenda fazenda) {
        return from(fazenda, TipoAcessoFazenda.ADMIN, null, List.of());
    }

    public static FazendaAcessivelResponseDTO funcionario(Funcionario funcionario) {
        return from(
                funcionario.getFazenda(),
                TipoAcessoFazenda.FUNCIONARIO,
                funcionario.getCargo().name(),
                funcionario.getCargo()
                        .getPermissoes()
                        .stream()
                        .map(Enum::name)
                        .sorted()
                        .toList()
        );
    }

    private static FazendaAcessivelResponseDTO from(
            Fazenda fazenda,
            TipoAcessoFazenda tipoAcesso,
            String cargo,
            List<String> permissoes
    ) {
        return new FazendaAcessivelResponseDTO(
                fazenda.getId(),
                fazenda.getNome(),
                fazenda.getCidade(),
                fazenda.getEstado(),
                fazenda.getLatitude(),
                fazenda.getLongitude(),
                fazenda.getAreaTotalHa(),
                fazenda.getExploracao().name(),
                fazenda.getGeopoligono(),
                tipoAcesso.name(),
                cargo,
                permissoes
        );
    }
}
