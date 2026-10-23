package br.univille.agendauni.controller;

import java.io.IOException;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import br.univille.agendauni.config.UsuarioSessao;
import br.univille.agendauni.dto.EventoDto;
import br.univille.agendauni.dto.EventoForm;
import br.univille.agendauni.exception.NaoEncontradoException;
import br.univille.agendauni.model.Evento;
import br.univille.agendauni.model.Status;
import br.univille.agendauni.repository.EventoRepository;
import br.univille.agendauni.service.EventoService;
import br.univille.agendauni.service.ImagemService;

/** ADMINISTRADOR: analisar, aprovar, rejeitar, editar e cancelar eventos. */
@RestController
@RequestMapping("/api/admin/solicitacoes")
public class AdminSolicitacaoController {

    private final EventoService servico;
    private final ImagemService imagens;
    private final EventoRepository eventos;

    public AdminSolicitacaoController(EventoService servico, ImagemService imagens, EventoRepository eventos) {
        this.servico = servico;
        this.imagens = imagens;
        this.eventos = eventos;
    }

    /** Item da lista: o evento + aviso de conflito já calculado + há quantos dias espera. */
    record ItemLista(EventoDto evento, String conflito, long diasEsperando) {}

    @GetMapping
    public List<ItemLista> listar(@RequestParam(defaultValue = "AGUARDANDO") Status status) {
        if (status == Status.RASCUNHO) return List.of(); // rascunho é privado do autor
        return eventos.findByStatusOrderByDataAscHoraInicioAsc(status).stream()
                .map(e -> new ItemLista(EventoDto.de(e),
                        status == Status.AGUARDANDO ? conflitoDe(e) : null,
                        ChronoUnit.DAYS.between(e.getAtualizadoEm().toLocalDate(), LocalDate.now())))
                .toList();
    }

    /** Quantos pedidos há em cada status (números das abas e do menu). */
    @GetMapping("/contagem")
    public Map<String, Long> contagem() {
        Map<String, Long> m = new LinkedHashMap<>();
        Arrays.stream(Status.values()).filter(s -> s != Status.RASCUNHO).forEach(s -> m.put(s.name(), eventos.countByStatus(s)));
        return m;
    }

    record Detalhe(EventoDto evento, String conflito) {}

    /** Mostra ao admin, antes de aprovar, se já existe conflito. */
    @GetMapping("/{id}")
    public Detalhe detalhe(@PathVariable Long id) {
        Evento ev = carregar(id);
        return new Detalhe(servico.paraDto(ev, true), ev.getStatus() == Status.AGUARDANDO ? conflitoDe(ev) : null);
    }

    @PostMapping("/{id}/aprovar")
    public EventoDto aprovar(@PathVariable Long id, @SessionAttribute(UsuarioSessao.ATRIBUTO) UsuarioSessao u) {
        return EventoDto.de(servico.aprovar(carregar(id), u.nome()));
    }

    @PostMapping("/{id}/rejeitar")
    public EventoDto rejeitar(@PathVariable Long id, @RequestBody Map<String, String> corpo,
                              @SessionAttribute(UsuarioSessao.ATRIBUTO) UsuarioSessao u) {
        return EventoDto.de(servico.rejeitar(carregar(id), corpo.get("motivo"), u.nome()));
    }

    /** Editar evento APROVADO: valida tudo e checa conflito de novo (ignorando ele mesmo). */
    @PutMapping("/{id}")
    public EventoDto editarAprovado(@PathVariable Long id, @RequestBody EventoForm form,
                                    @SessionAttribute(UsuarioSessao.ATRIBUTO) UsuarioSessao u) {
        return EventoDto.de(servico.editarAprovado(carregar(id), form, u.nome()));
    }

    @PostMapping("/{id}/cancelar")
    public EventoDto cancelar(@PathVariable Long id, @SessionAttribute(UsuarioSessao.ATRIBUTO) UsuarioSessao u) {
        return EventoDto.de(servico.cancelar(carregar(id), Status.APROVADO,
                "Somente eventos aprovados são cancelados aqui.", u.nome()));
    }

    @PostMapping("/{id}/imagem")
    public ResponseEntity<Void> enviarImagem(@PathVariable Long id, @RequestParam("arquivo") MultipartFile arquivo,
                                             @SessionAttribute(UsuarioSessao.ATRIBUTO) UsuarioSessao u) throws IOException {
        imagens.salvar(carregar(id), arquivo, u.nome());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/imagem")
    public ResponseEntity<Void> removerImagem(@PathVariable Long id, @SessionAttribute(UsuarioSessao.ATRIBUTO) UsuarioSessao u) {
        imagens.remover(carregar(id), u.nome());
        return ResponseEntity.noContent().build();
    }

    private String conflitoDe(Evento ev) {
        return servico.buscarConflito(EventoForm.de(ev), ev.getId())
                .map(c -> "\"" + c.getNome() + "\" das " + c.getHoraInicio() + " às " + c.getHoraFim())
                .orElse(null);
    }

    private Evento carregar(Long id) {
        Evento ev = servico.buscar(id);
        if (ev.getStatus() == Status.RASCUNHO) throw new NaoEncontradoException("Solicitação não encontrada.");
        return ev;
    }
}
