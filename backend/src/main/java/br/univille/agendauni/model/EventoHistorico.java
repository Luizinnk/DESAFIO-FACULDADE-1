package br.univille.agendauni.model;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/** Uma linha da linha do tempo da solicitação. */
@Entity
@Table(name = "evento_historico")
@Getter @Setter
public class EventoHistorico {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false)
    private Evento evento;
    private String acao;
    private String detalhe;
    private String usuarioNome;
    private LocalDateTime dataHora = LocalDateTime.now();
}
