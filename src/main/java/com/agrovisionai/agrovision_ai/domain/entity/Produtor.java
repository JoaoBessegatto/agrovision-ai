package com.agrovisionai.agrovision_ai.domain.entity;

import com.agrovisionai.agrovision_ai.auth.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "produtor")
@Getter
@Setter
@NoArgsConstructor
public class Produtor {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String nomeCompleto;

    @Column(unique = true, nullable = false)
    private String cpfOrCnpj;

    @Column(nullable = false)
    private LocalDate dataNascimento;

    @Column(nullable = false)
    private String telefone;

    @OneToOne
    private Usuario usuario;

    @OneToMany(mappedBy = "produtor")
    private List<Fazenda> fazendas;
}
