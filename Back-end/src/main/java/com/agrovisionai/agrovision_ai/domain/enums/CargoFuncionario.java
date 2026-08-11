package com.agrovisionai.agrovision_ai.domain.enums;

public enum CargoFuncionario {

    GERENTE(
            true, true, true
    ),
    TRATADOR(
            true, false, false
    ),
    VETERINARIO(
            true, false, true
    );

    private final boolean podeRegistrarPeso;
    private final boolean podeTransferirAnimal;
    private final boolean podeGerenciarRebanho;

    CargoFuncionario(
            boolean podeRegistrarPeso,
            boolean podeTransferirAnimal,
            boolean podeGerenciarRebanho
    ) {
        this.podeRegistrarPeso = podeRegistrarPeso;
        this.podeTransferirAnimal = podeTransferirAnimal;
        this.podeGerenciarRebanho = podeGerenciarRebanho;
    }

    public boolean podeRegistrarPeso() {
        return podeRegistrarPeso;
    }

    public boolean podeTransferirAnimal() {
        return podeTransferirAnimal;
    }

    public boolean podeGerenciarRebanho() {
        return podeGerenciarRebanho;
    }
}
