package br.univille.agendauni.controller;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.annotation.JsonFormat;

import br.univille.agendauni.config.UsuarioSessao;
import br.univille.agendauni.exception.NaoEncontradoException;
import br.univille.agendauni.model.Evento;
import br.univille.agendauni.model.EventoImagem;
import br.univille.agendauni.model.Status;
import br.univille.agendauni.repository.EventoImagemRepository;
import br.univille.agendauni.repository.EventoRepository;
import br.univille.agendauni.service.EventoService;
import jakarta.servlet.http.HttpSession;

/** Área pública: agenda, página do evento e imagem. Não exige login. */
@RestController
public class PublicoController {

    private final EventoRepository eventos;
    private final EventoImagemRepository imagens;
    private final EventoService servico;

    public PublicoController(EventoRepository eventos, EventoImagemRepository imagens, EventoService servico) {
        this.eventos = eventos;
        this.imagens = imagens;
        this.servico = servico;
    }

    /** Só o que pode ser mostrado ao público (sem justificativa, centro de custo etc.). */
    record EventoPublico(Long id, LocalDate data, String nome, String tema,
                         @JsonFormat(pattern = "HH:mm") LocalTime horaInicio,
                         @JsonFormat(pattern = "HH:mm") LocalTime horaFim,
                         String local, String palestrante, String curso, String publicoAlvo, String objetivo,
                         String imagem) {}

    record Agenda(LocalDate inicio, LocalDate fim, List<EventoPublico> eventos) {}

    /** Eventos APROVADOS do mês atual e dos dois meses seguintes. */
    @GetMapping("/api/publico/agenda")
    public Agenda agenda() {
        LocalDate inicio = LocalDate.now().withDayOfMonth(1);              // 1º dia do mês atual
        LocalDate fim = inicio.plusMonths(3).minusDays(1);                 // último dia do mês atual + 2
        List<EventoPublico> lista = eventos
                .findByStatusAndDataBetweenOrderByDataAscHoraInicioAsc(Status.APROVADO, inicio, fim).stream()
                .map(this::publico).toList();
        return new Agenda(inicio, fim, lista);
    }

    /** Página pública de um evento aprovado. */
    @GetMapping("/api/publico/eventos/{id}")
    public EventoPublico evento(@PathVariable Long id) {
        Evento e = eventos.findById(id).filter(ev -> ev.getStatus() == Status.APROVADO)
                .orElseThrow(() -> new NaoEncontradoException("Evento não encontrado."));
        return publico(e);
    }

    /** Imagem do evento: pública se aprovado; antes disso, só o autor ou um administrador vê. */
    @GetMapping("/api/publico/eventos/{id}/imagem")
    public ResponseEntity<byte[]> imagem(@PathVariable Long id, HttpSession sessao) {
        Evento e = servico.buscar(id);
        UsuarioSessao u = (UsuarioSessao) sessao.getAttribute(UsuarioSessao.ATRIBUTO);
        boolean pode = e.getStatus() == Status.APROVADO
                || (u != null && (u.isAdmin() || e.getAutor().getId().equals(u.id())));
        EventoImagem img = imagens.findById(id).filter(i -> pode)
                .orElseThrow(() -> new NaoEncontradoException("Imagem não encontrada."));
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(img.getTipo()))
                .cacheControl(CacheControl.noCache())
                .body(img.getDados());
    }

    private EventoPublico publico(Evento e) {
        return new EventoPublico(e.getId(), e.getData(), e.getNome(), e.getTema().getNome(), e.getHoraInicio(),
                e.getHoraFim(), e.getLocal().getNome(), e.getPalestrante(), e.getCurso().getNome(),
                e.getPublicoAlvo(), e.getObjetivo(), servico.paraDto(e, false).imagem());
    }
}
