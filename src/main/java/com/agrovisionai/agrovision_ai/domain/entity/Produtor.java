package com.agrovisionai.agrovision_ai.domain.entity;

import com.agrovisionai.agrovision_ai.auth.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Entity
@Table(name = "produtor")
@Getter
@Setter
@NoArgsConstructor
public class Produtor {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private Long id;

    private String nomeCompleto;
    private String cpfOrCnpj;

    @OneToOne
    private Usuario usuario;

    @OneToMany(mappedBy = "produtor")
    private List<Fazenda> fazendas;
}
