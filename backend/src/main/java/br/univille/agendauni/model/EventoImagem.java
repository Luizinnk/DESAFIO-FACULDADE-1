package br.univille.agendauni.model;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/** Arte do evento. Fica numa tabela separada para não carregar os bytes junto com cada evento. */
@Entity
@Table(name = "evento_imagens")
@Getter @Setter
public class EventoImagem {
    @Id
    private Long eventoId;
    private String tipo;
    private byte[] dados;
    private LocalDateTime atualizadoEm = LocalDateTime.now();
}
