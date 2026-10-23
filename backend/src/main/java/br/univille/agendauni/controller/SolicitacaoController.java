package br.univille.agendauni.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import br.univille.agendauni.config.UsuarioSessao;
import br.univille.agendauni.dto.EventoDto;
import br.univille.agendauni.dto.EventoForm;
import br.univille.agendauni.exception.NaoEncontradoException;
import br.univille.agendauni.exception.RegraNegocioException;
import br.univille.agendauni.model.Evento;
import br.univille.agendauni.model.Status;
import br.univille.agendauni.repository.EventoRepository;
import br.univille.agendauni.repository.UsuarioRepository;
import br.univille.agendauni.service.EventoService;

/** Área do SOLICITANTE: só enxerga e altera as próprias solicitações. */
@RestController
@RequestMapping("/api/solicitacoes")
public class SolicitacaoController {

    private final EventoService servico;
    private final EventoRepository eventos;
    private final UsuarioRepository usuarios;

    public SolicitacaoController(EventoService servico, EventoRepository eventos, UsuarioRepository usuarios) {
        this.servico = servico;
        this.eventos = eventos;
        this.usuarios = usuarios;
    }

    @GetMapping
    public List<EventoDto> minhas(@SessionAttribute(UsuarioSessao.ATRIBUTO) UsuarioSessao u) {
        return eventos.findByAutorIdOrderByAtualizadoEmDesc(u.id()).stream().map(EventoDto::de).toList();
    }

    @GetMapping("/{id}")
    public EventoDto detalhe(@PathVariable Long id, @SessionAttribute(UsuarioSessao.ATRIBUTO) UsuarioSessao u) {
        return EventoDto.de(doAutor(id, u));
    }

    /** acao=salvar (rascunho) ou acao=enviar (vai para aprovação). */
    @PostMapping
    public EventoDto criar(@RequestParam String acao, @RequestBody EventoForm form,
                           @SessionAttribute(UsuarioSessao.ATRIBUTO) UsuarioSessao u) {
        Evento novo = servico.novo(usuarios.getReferenceById(u.id()));
        return EventoDto.de(servico.gravarPeloSolicitante(novo, form, "enviar".equals(acao)));
    }

    @PutMapping("/{id}")
    public EventoDto atualizar(@PathVariable Long id, @RequestParam String acao, @RequestBody EventoForm form,
                               @SessionAttribute(UsuarioSessao.ATRIBUTO) UsuarioSessao u) {
        Evento ev = doAutor(id, u);
        if (!EventoService.EDITAVEIS_PELO_AUTOR.contains(ev.getStatus())) {
            throw new RegraNegocioException("Esta solicitação não pode mais ser alterada.");
        }
        return EventoDto.de(servico.gravarPeloSolicitante(ev, form, "enviar".equals(acao)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id, @SessionAttribute(UsuarioSessao.ATRIBUTO) UsuarioSessao u) {
        servico.excluirRascunho(doAutor(id, u));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/cancelar")
    public EventoDto cancelar(@PathVariable Long id, @SessionAttribute(UsuarioSessao.ATRIBUTO) UsuarioSessao u) {
        return EventoDto.de(servico.cancelar(doAutor(id, u), Status.AGUARDANDO,
                "Só é possível cancelar solicitações que aguardam aprovação."));
    }

    /** Busca a solicitação garantindo que pertence a quem está logado. */
    private Evento doAutor(Long id, UsuarioSessao u) {
        Evento ev = servico.buscar(id);
        if (!ev.getAutor().getId().equals(u.id())) throw new NaoEncontradoException("Solicitação não encontrada.");
        return ev;
    }
}
