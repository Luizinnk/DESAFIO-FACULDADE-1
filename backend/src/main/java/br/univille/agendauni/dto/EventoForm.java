package br.univille.agendauni.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;

import br.univille.agendauni.model.Evento;
import br.univille.agendauni.model.Recurso;

/** Dados que chegam do formulário de solicitação. */
public record EventoForm(
        String nome, Long temaId,
        LocalDate data,
        @JsonFormat(pattern = "HH:mm") LocalTime horaInicio,
        @JsonFormat(pattern = "HH:mm") LocalTime horaFim,
        Long localId, Long cursoId,
        String solicitante, String palestrante, String publicoAlvo, Integer publicoEstimado,
        String justificativa, String objetivo,
        Boolean cerimonial, Boolean inscricoes, Boolean declaracoes,
        String observacoes, List<Long> recursoIds) {

    public List<Long> recursoIdsOuVazio() { return recursoIds == null ? List.of() : recursoIds; }

    /** Monta o formulário a partir de um evento salvo (usado para revalidar na aprovação). */
    public static EventoForm de(Evento e) {
        return new EventoForm(e.getNome(), e.getTema() == null ? null : e.getTema().getId(),
                e.getData(), e.getHoraInicio(), e.getHoraFim(),
                e.getLocal() == null ? null : e.getLocal().getId(),
                e.getCurso() == null ? null : e.getCurso().getId(),
                e.getSolicitante(), e.getPalestrante(), e.getPublicoAlvo(), e.getPublicoEstimado(),
                e.getJustificativa(), e.getObjetivo(),
                e.getCerimonial(), e.getInscricoes(), e.getDeclaracoes(), e.getObservacoes(),
                e.getRecursos().stream().map(Recurso::getId).toList());
    }
}
