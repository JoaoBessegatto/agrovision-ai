package com.agrovisionai.agrovision_ai.domain.enums;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;

public enum CargoFuncionario {

    GERENTE(
            PermissaoFuncionario.VISUALIZAR_FAZENDA,
            PermissaoFuncionario.REGISTRAR_PESO,
            PermissaoFuncionario.CADASTRAR_ANIMAL,
            PermissaoFuncionario.TRANSFERIR_ANIMAL,
            PermissaoFuncionario.ALTERAR_SITUACAO_ANIMAL,
            PermissaoFuncionario.GERENCIAR_REBANHO
    ),

    TRATADOR(
            PermissaoFuncionario.VISUALIZAR_FAZENDA,
            PermissaoFuncionario.REGISTRAR_PESO
    ),

    VETERINARIO(
            PermissaoFuncionario.VISUALIZAR_FAZENDA,
            PermissaoFuncionario.REGISTRAR_PESO,
            PermissaoFuncionario.REGISTRAR_MORTE
    );

    private final Set<PermissaoFuncionario> permissoes;

    CargoFuncionario(PermissaoFuncionario... permissoes) {
        EnumSet<PermissaoFuncionario> conjunto = EnumSet.noneOf(PermissaoFuncionario.class);
        Collections.addAll(conjunto, permissoes);
        this.permissoes = Collections.unmodifiableSet(conjunto);
    }

    public boolean possuiPermissao(PermissaoFuncionario permissao) {
        return permissoes.contains(permissao);
    }

    public Set<PermissaoFuncionario> getPermissoes() {
        return permissoes;
    }

    public boolean podeRegistrarPeso() {
        return possuiPermissao(PermissaoFuncionario.REGISTRAR_PESO);
    }

    public boolean podeTransferirAnimal() {
        return possuiPermissao(PermissaoFuncionario.TRANSFERIR_ANIMAL);
    }

    public boolean podeGerenciarRebanho() {
        return possuiPermissao(PermissaoFuncionario.GERENCIAR_REBANHO);
    }
}
