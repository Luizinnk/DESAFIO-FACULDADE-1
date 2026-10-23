package br.univille.agendauni.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "centros_custo")
@Getter @Setter
public class CentroCusto {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String codigo;
    private String nome;

    public String getDescricao() { return codigo + " - " + nome; }
}
