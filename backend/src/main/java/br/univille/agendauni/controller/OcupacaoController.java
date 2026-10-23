package br.univille.agendauni.controller;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.annotation.JsonFormat;

import br.univille.agendauni.config.UsuarioSessao;
import br.univille.agendauni.dto.EventoForm;
import br.univille.agendauni.exception.NaoEncontradoException;
import br.univille.agendauni.exception.RegraNegocioException;
import br.univille.agendauni.model.Bloqueio;
import br.univille.agendauni.model.Evento;
import br.univille.agendauni.model.Local;
import br.univille.agendauni.model.Status;
import br.univille.agendauni.repository.BloqueioRepository;
import br.univille.agendauni.repository.EventoRepository;
import br.univille.agendauni.repository.LocalRepository;
import br.univille.agendauni.service.EventoService;

/**
 * Ocupação dos locais: disponibilidade no formulário, grade do dia por sala,
 * painel inicial do administrador e bloqueios de sala.
 */
@RestController
public class OcupacaoController {

    private static final List<Status> OCUPAM = List.of(Status.APROVADO, Status.AGUARDANDO);

    private final EventoRepository eventos;
    private final LocalRepository locais;
    private final BloqueioRepository bloqueios;
    private final EventoService servico;

    public OcupacaoController(EventoRepository eventos, LocalRepository locais, BloqueioRepository bloqueios,
                              EventoService servico) {
        this.eventos = eventos;
        this.locais = locais;
        this.bloqueios = bloqueios;
        this.servico = servico;
    }

    /** Um horário ocupado. Pedidos de outras pessoas em análise aparecem sem o nome. */
    record Ocupacao(Long id, String nome, @JsonFormat(pattern = "HH:mm") LocalTime horaInicio,
                    @JsonFormat(pattern = "HH:mm") LocalTime horaFim, String status) {}

    record Disponibilidade(String local, Integer capacidade, String bloqueio, List<Ocupacao> ocupacoes) {}

    /** Usado pelo formulário: o que já existe naquele local e dia, ANTES de enviar. */
    @GetMapping("/api/disponibilidade")
    public Disponibilidade disponibilidade(@RequestParam Long localId,
                                           @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data,
                                           @RequestParam(required = false) Long ignorarId,
                                           @SessionAttribute(UsuarioSessao.ATRIBUTO) UsuarioSessao u) {
        Local local = locais.findById(localId).orElseThrow(() -> new NaoEncontradoException("Local não encontrado."));
        List<Ocupacao> lista = eventos.findByLocalIdAndDataAndStatusInOrderByHoraInicio(localId, data, OCUPAM).stream()
                .filter(e -> !e.getId().equals(ignorarId))
                .map(e -> new Ocupacao(e.getId(), visivel(e, u) ? e.getNome() : "Outro pedido em análise",
                        e.getHoraInicio(), e.getHoraFim(), e.getStatus().name()))
                .toList();
        String bloqueio = bloqueios.buscar(localId, data).map(Bloqueio::getMotivo).orElse(null);
        return new Disponibilidade(local.getNome(), local.getCapacidade(), bloqueio, lista);
    }

    private boolean visivel(Evento e, UsuarioSessao u) {
        return u.isAdmin() || e.getStatus() == Status.APROVADO || e.getAutor().getId().equals(u.id());
    }

    record LinhaLocal(Long id, String nome, Integer capacidade, String bloqueio, List<Ocupacao> ocupacoes) {}

    /** ADMIN: grade do dia com uma linha por local (aprovados e pendentes). */
    @GetMapping("/api/admin/ocupacao")
    public List<LinhaLocal> ocupacao(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return locais.findAll(Sort.by("nome")).stream().map(l -> new LinhaLocal(l.getId(), l.getNome(), l.getCapacidade(),
                bloqueios.buscar(l.getId(), data).map(Bloqueio::getMotivo).orElse(null),
                eventos.findByLocalIdAndDataAndStatusInOrderByHoraInicio(l.getId(), data, OCUPAM).stream()
                        .map(e -> new Ocupacao(e.getId(), e.getNome(), e.getHoraInicio(), e.getHoraFim(), e.getStatus().name()))
                        .toList())).toList();
    }

    record ItemPainel(Long id, String nome, LocalDate data, @JsonFormat(pattern = "HH:mm") LocalTime horaInicio,
                      String local, String status, String conflito) {}

    record Painel(long aguardando, long estaSemana, long comConflito, List<ItemPainel> urgentes, List<ItemPainel> proximos) {}

    /** ADMIN: tela inicial com o que precisa de atenção. */
    @GetMapping("/api/admin/painel")
    public Painel painel() {
        LocalDate hoje = LocalDate.now();
        LocalDate fimSemana = hoje.with(DayOfWeek.SUNDAY);
        List<Evento> pendentes = eventos.findByStatusOrderByDataAscHoraInicioAsc(Status.AGUARDANDO);
        List<ItemPainel> pendentesItens = pendentes.stream().map(e -> item(e, servico.buscarConflito(EventoForm.de(e), e.getId())
                .map(c -> c.getNome()).orElse(null))).toList();
        List<ItemPainel> urgentes = pendentesItens.stream()
                .filter(i -> i.data() != null && !i.data().isAfter(hoje.plusDays(7))).toList();
        List<ItemPainel> proximos = eventos.findByStatusAndDataBetweenOrderByDataAscHoraInicioAsc(Status.APROVADO, hoje, hoje.plusDays(7))
                .stream().map(e -> item(e, null)).toList();
        long semana = eventos.findByStatusAndDataBetweenOrderByDataAscHoraInicioAsc(Status.APROVADO, hoje, fimSemana).size();
        long conflitos = pendentesItens.stream().filter(i -> i.conflito() != null).count();
        return new Painel(pendentes.size(), semana, conflitos, urgentes, proximos);
    }

    private ItemPainel item(Evento e, String conflito) {
        return new ItemPainel(e.getId(), e.getNome(), e.getData(), e.getHoraInicio(),
                e.getLocal() == null ? null : e.getLocal().getNome(), e.getStatus().name(), conflito);
    }

    /* ---------------- Bloqueios de sala ---------------- */

    record BloqueioDto(Long id, Long localId, String local, LocalDate dataInicio, LocalDate dataFim, String motivo) {
        static BloqueioDto de(Bloqueio b) {
            return new BloqueioDto(b.getId(), b.getLocal().getId(), b.getLocal().getNome(), b.getDataInicio(), b.getDataFim(), b.getMotivo());
        }
    }

    record BloqueioForm(Long localId, LocalDate dataInicio, LocalDate dataFim, String motivo) {}

    /** Bloqueios que ainda não terminaram. */
    @GetMapping("/api/admin/bloqueios")
    public List<BloqueioDto> listarBloqueios() {
        return bloqueios.findByDataFimGreaterThanEqualOrderByDataInicio(LocalDate.now()).stream().map(BloqueioDto::de).toList();
    }

    @PostMapping("/api/admin/bloqueios")
    public BloqueioDto bloquear(@RequestBody BloqueioForm f) {
        if (f.localId() == null || f.dataInicio() == null || f.motivo() == null || f.motivo().isBlank()) {
            throw new RegraNegocioException("Informe o local, a data e o motivo do bloqueio.");
        }
        LocalDate fim = f.dataFim() == null ? f.dataInicio() : f.dataFim();
        if (fim.isBefore(f.dataInicio())) throw new RegraNegocioException("A data final deve ser igual ou depois da inicial.");
        Bloqueio b = new Bloqueio();
        b.setLocal(locais.findById(f.localId()).orElseThrow(() -> new NaoEncontradoException("Local não encontrado.")));
        b.setDataInicio(f.dataInicio());
        b.setDataFim(fim);
        b.setMotivo(f.motivo().trim());
        return BloqueioDto.de(bloqueios.save(b));
    }

    @DeleteMapping("/api/admin/bloqueios/{id}")
    public ResponseEntity<Void> desbloquear(@PathVariable Long id) {
        bloqueios.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
