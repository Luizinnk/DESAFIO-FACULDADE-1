package br.univille.agendauni.model;

import java.time.LocalDate;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/** Período em que um local não pode receber eventos (manutenção, provas...). */
@Entity
@Table(name = "bloqueios")
@Getter @Setter
public class Bloqueio {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false)
    private Local local;
    private LocalDate dataInicio;
    private LocalDate dataFim;
    private String motivo;
}
