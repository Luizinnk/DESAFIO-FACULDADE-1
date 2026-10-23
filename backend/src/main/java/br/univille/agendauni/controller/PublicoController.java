package br.univille.agendauni.controller;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.annotation.JsonFormat;

import br.univille.agendauni.model.Status;
import br.univille.agendauni.repository.EventoRepository;

/** Agenda pública: eventos APROVADOS do mês atual e dos dois meses seguintes. */
@RestController
public class PublicoController {

    private final EventoRepository eventos;

    public PublicoController(EventoRepository eventos) { this.eventos = eventos; }

    record EventoPublico(LocalDate data, String nome, String tema,
                         @JsonFormat(pattern = "HH:mm") LocalTime horaInicio,
                         @JsonFormat(pattern = "HH:mm") LocalTime horaFim,
                         String local, String palestrante, String curso) {}

    record Agenda(LocalDate inicio, LocalDate fim, List<EventoPublico> eventos) {}

    @GetMapping("/api/publico/agenda")
    public Agenda agenda() {
        LocalDate inicio = LocalDate.now().withDayOfMonth(1);              // 1º dia do mês atual
        LocalDate fim = inicio.plusMonths(3).minusDays(1);                 // último dia do mês atual + 2
        List<EventoPublico> lista = eventos
                .findByStatusAndDataBetweenOrderByDataAscHoraInicioAsc(Status.APROVADO, inicio, fim).stream()
                .map(e -> new EventoPublico(e.getData(), e.getNome(), e.getTema().getNome(), e.getHoraInicio(),
                        e.getHoraFim(), e.getLocal().getNome(), e.getPalestrante(), e.getCurso().getNome()))
                .toList();
        return new Agenda(inicio, fim, lista);
    }
}
