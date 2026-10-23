package br.univille.agendauni.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/** Solicitação de evento. Depois de aprovada, é o próprio evento publicado. */
@Entity
@Table(name = "eventos")
@Getter @Setter
public class Evento {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Usuario autor;          // quem estava logado
    private String solicitante;     // nome livre informado no formulário

    private String nome;
    @ManyToOne private Tema tema;
    private LocalDate data;
    private LocalTime horaInicio;
    private LocalTime horaFim;
    @ManyToOne private Local local;
    @ManyToOne private Curso curso;
    private String palestrante;
    private String publicoAlvo;
    private Integer publicoEstimado;
    private String justificativa;
    private String objetivo;
    private Boolean cerimonial;
    private Boolean inscricoes;
    private Boolean declaracoes;
    private String observacoes;

    @Enumerated(EnumType.STRING)
    private Status status = Status.RASCUNHO;
    private String motivoRejeicao;

    private LocalDateTime criadoEm = LocalDateTime.now();
    private LocalDateTime atualizadoEm = LocalDateTime.now();

    @ManyToMany
    @JoinTable(name = "evento_recursos",
            joinColumns = @JoinColumn(name = "evento_id"),
            inverseJoinColumns = @JoinColumn(name = "recurso_id"))
    private Set<Recurso> recursos = new HashSet<>();

    @PreUpdate
    void aoAtualizar() { atualizadoEm = LocalDateTime.now(); }
}
