package br.univille.agendauni.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.*;

import br.univille.agendauni.dto.EventoDto;
import br.univille.agendauni.dto.EventoForm;
import br.univille.agendauni.exception.NaoEncontradoException;
import br.univille.agendauni.exception.RegraNegocioException;
import br.univille.agendauni.model.Evento;
import br.univille.agendauni.model.Status;
import br.univille.agendauni.repository.EventoRepository;
import br.univille.agendauni.service.EventoService;

/** ADMINISTRADOR: analisar, aprovar, rejeitar, editar e cancelar eventos. */
@RestController
@RequestMapping("/api/admin/solicitacoes")
public class AdminSolicitacaoController {

    private final EventoService servico;
    private final EventoRepository eventos;

    public AdminSolicitacaoController(EventoService servico, EventoRepository eventos) {
        this.servico = servico;
        this.eventos = eventos;
    }

    @GetMapping
    public List<EventoDto> listar(@RequestParam(defaultValue = "AGUARDANDO") Status status) {
        if (status == Status.RASCUNHO) return List.of(); // rascunho é privado do autor
        return eventos.findByStatusOrderByDataAscHoraInicioAsc(status).stream().map(EventoDto::de).toList();
    }

    record Detalhe(EventoDto evento, String conflito) {}

    /** Mostra ao admin, antes de aprovar, se já existe conflito. */
    @GetMapping("/{id}")
    public Detalhe detalhe(@PathVariable Long id) {
        Evento ev = carregar(id);
        String conflito = ev.getStatus() != Status.AGUARDANDO ? null
                : servico.buscarConflito(EventoForm.de(ev), ev.getId())
                    .map(c -> "\"" + c.getNome() + "\" das " + c.getHoraInicio() + " às " + c.getHoraFim())
                    .orElse(null);
        return new Detalhe(EventoDto.de(ev), conflito);
    }

    @PostMapping("/{id}/aprovar")
    public EventoDto aprovar(@PathVariable Long id) {
        return EventoDto.de(servico.aprovar(carregar(id)));
    }

    @PostMapping("/{id}/rejeitar")
    public EventoDto rejeitar(@PathVariable Long id, @RequestBody Map<String, String> corpo) {
        return EventoDto.de(servico.rejeitar(carregar(id), corpo.get("motivo")));
    }

    /** Editar evento APROVADO: valida tudo e checa conflito de novo (ignorando ele mesmo). */
    @PutMapping("/{id}")
    public EventoDto editarAprovado(@PathVariable Long id, @RequestBody EventoForm form) {
        Evento ev = carregar(id);
        if (ev.getStatus() != Status.APROVADO) throw new RegraNegocioException("Somente eventos aprovados são editados aqui.");
        List<String> erros = servico.validarEnvio(form, ev.getId());
        if (!erros.isEmpty()) throw new RegraNegocioException(erros);
        return EventoDto.de(servico.salvar(ev, form, Status.APROVADO));
    }

    @PostMapping("/{id}/cancelar")
    public EventoDto cancelar(@PathVariable Long id) {
        return EventoDto.de(servico.cancelar(carregar(id), Status.APROVADO, "Somente eventos aprovados são cancelados aqui."));
    }

    private Evento carregar(Long id) {
        Evento ev = servico.buscar(id);
        if (ev.getStatus() == Status.RASCUNHO) throw new NaoEncontradoException("Solicitação não encontrada.");
        return ev;
    }
}
