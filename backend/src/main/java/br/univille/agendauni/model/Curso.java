package br.univille.agendauni.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/** Curso ou coordenação. O centro de custo vem daqui automaticamente. */
@Entity
@Table(name = "cursos")
@Getter @Setter
public class Curso {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nome;
    @ManyToOne(optional = false)
    private CentroCusto centroCusto;
}
