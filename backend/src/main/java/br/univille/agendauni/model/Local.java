package br.univille.agendauni.model;

import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/** Ambiente onde o evento acontece. Define quais recursos podem ser pedidos. */
@Entity
@Table(name = "locais")
@Getter @Setter
public class Local {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nome;

    @ManyToMany
    @JoinTable(name = "local_recursos",
            joinColumns = @JoinColumn(name = "local_id"),
            inverseJoinColumns = @JoinColumn(name = "recurso_id"))
    private Set<Recurso> recursos = new HashSet<>();
}
