package br.univille.agendauni.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.univille.agendauni.dto.EventoDto;
import br.univille.agendauni.dto.EventoForm;
import br.univille.agendauni.exception.NaoEncontradoException;
import br.univille.agendauni.exception.RegraNegocioException;
import br.univille.agendauni.model.Evento;
import br.univille.agendauni.model.EventoHistorico;
import br.univille.agendauni.model.Local;
import br.univille.agendauni.model.Recurso;
import br.univille.agendauni.model.Status;
import br.univille.agendauni.model.Usuario;
import br.univille.agendauni.repository.BloqueioRepository;
import br.univille.agendauni.repository.CursoRepository;
import br.univille.agendauni.repository.EventoHistoricoRepository;
import br.univille.agendauni.repository.EventoImagemRepository;
import br.univille.agendauni.repository.EventoRepository;
import br.univille.agendauni.repository.LocalRepository;
import br.univille.agendauni.repository.RecursoRepository;
import br.univille.agendauni.repository.TemaRepository;

/**
 * REGRAS DE NEGÓCIO das solicitações de evento.
 * Os controllers só recebem a requisição e chamam este serviço.
 */
@Service
public class EventoService {

    /** Estados em que o AUTOR ainda pode editar (aprovado, só o admin altera). */
    public static final Set<Status> EDITAVEIS_PELO_AUTOR = Set.of(Status.RASCUNHO, Status.AGUARDANDO, Status.REJEITADO);

    private final EventoRepository eventos;
    private final TemaRepository temas;
    private final LocalRepository locais;
    private final CursoRepository cursos;
    private final RecursoRepository recursos;
    private final BloqueioRepository bloqueios;
    private final EventoHistoricoRepository historico;
    private final EventoImagemRepository imagens;

    public EventoService(EventoRepository eventos, TemaRepository temas, LocalRepository locais, CursoRepository cursos,
                         RecursoRepository recursos, BloqueioRepository bloqueios, EventoHistoricoRepository historico,
                         EventoImagemRepository imagens) {
        this.eventos = eventos;
        this.temas = temas;
        this.locais = locais;
        this.cursos = cursos;
        this.recursos = recursos;
        this.bloqueios = bloqueios;
        this.historico = historico;
        this.imagens = imagens;
    }

    public Evento buscar(Long id) {
        return eventos.findById(id).orElseThrow(() -> new NaoEncontradoException("Solicitação não encontrada."));
    }

    /** Monta o DTO completo: com endereço da imagem e, se pedido, a linha do tempo. */
    public EventoDto paraDto(Evento e, boolean comHistorico) {
        String imagem = imagens.findById(e.getId())
                .map(i -> "/api/publico/eventos/" + e.getId() + "/imagem?v=" + i.getAtualizadoEm().hashCode())
                .orElse(null);
        List<EventoDto.Historico> linhas = comHistorico
                ? historico.findByEventoIdOrderByDataHoraAscIdAsc(e.getId()).stream().map(EventoDto.Historico::de).toList()
                : List.of();
        return EventoDto.de(e, imagem, linhas);
    }

    /** Rascunho pode estar incompleto: só exige o nome para identificar. */
    public List<String> validarRascunho(EventoForm f) {
        List<String> erros = new ArrayList<>();
        if (vazio(f.nome())) erros.add("Informe pelo menos o nome do evento para salvar o rascunho.");
        erros.addAll(validarRecursosDoLocal(f));
        return erros;
    }

    /** Validação COMPLETA: usada no ENVIO, na APROVAÇÃO e na edição de um aprovado. */
    public List<String> validarEnvio(EventoForm f, Long idAtual) {
        List<String> erros = new ArrayList<>();
        Map<String, Object> obrigatorios = new LinkedHashMap<>();
        obrigatorios.put("Nome do evento", f.nome());
        obrigatorios.put("Tema", f.temaId());
        obrigatorios.put("Data", f.data());
        obrigatorios.put("Horário de início", f.horaInicio());
        obrigatorios.put("Horário de término", f.horaFim());
        obrigatorios.put("Local", f.localId());
        obrigatorios.put("Curso / coordenação", f.cursoId());
        obrigatorios.put("Solicitante", f.solicitante());
        obrigatorios.put("Palestrante", f.palestrante());
        obrigatorios.put("Público-alvo", f.publicoAlvo());
        obrigatorios.put("Justificativa", f.justificativa());
        obrigatorios.put("Objetivo", f.objetivo());
        obrigatorios.put("Cerimonial (sim/não)", f.cerimonial());
        obrigatorios.put("Haverá inscrições (sim/não)", f.inscricoes());
        obrigatorios.put("Necessidade de declarações (sim/não)", f.declaracoes());
        obrigatorios.forEach((rotulo, valor) -> {
            if (valor == null || (valor instanceof String s && s.isBlank())) erros.add("Preencha: " + rotulo + ".");
        });
        if (!erros.isEmpty()) return erros; // sem o básico não dá para checar o resto

        if (f.data().isBefore(LocalDate.now())) erros.add("A data do evento deve ser hoje ou uma data futura.");
        if (!f.horaFim().isAfter(f.horaInicio())) erros.add("O horário de término deve ser depois do início (mesmo dia).");
        if (!temas.existsById(f.temaId())) erros.add("Tema inválido.");
        if (!cursos.existsById(f.cursoId())) erros.add("Curso inválido.");
        Local local = locais.findById(f.localId()).orElse(null);
        if (local == null) erros.add("Local inválido.");
        erros.addAll(validarRecursosDoLocal(f));

        // Capacidade: só confere quando os dois números foram informados
        if (local != null && local.getCapacidade() != null && f.publicoEstimado() != null
                && f.publicoEstimado() > local.getCapacidade()) {
            erros.add("O público estimado (" + f.publicoEstimado() + ") é maior que a capacidade de "
                    + local.getNome() + " (" + local.getCapacidade() + " pessoas).");
        }
        if (f.publicoEstimado() != null && f.publicoEstimado() < 1) erros.add("O público estimado deve ser maior que zero.");

        // Local bloqueado nessa data (manutenção, provas...)
        if (local != null) {
            bloqueios.buscar(local.getId(), f.data()).ifPresent(b ->
                    erros.add(local.getNome() + " está bloqueado nessa data: " + b.getMotivo() + "."));
        }

        if (erros.isEmpty()) {
            buscarConflito(f, idAtual).ifPresent(c -> erros.add(
                    "Conflito de agenda: " + c.getLocal().getNome() + " já está reservado para \"" + c.getNome()
                            + "\" das " + c.getHoraInicio() + " às " + c.getHoraFim() + " nessa data."));
        }
        return erros;
    }

    public Optional<Evento> buscarConflito(EventoForm f, Long ignorarId) {
        if (f.localId() == null || f.data() == null || f.horaInicio() == null || f.horaFim() == null) return Optional.empty();
        return eventos.buscarConflito(f.localId(), f.data(), f.horaInicio(), f.horaFim(), ignorarId);
    }

    /** Só podem ser marcados recursos que o local escolhido oferece. */
    private List<String> validarRecursosDoLocal(EventoForm f) {
        if (f.recursoIdsOuVazio().isEmpty()) return List.of();
        if (f.localId() == null) return List.of("Escolha o local antes de marcar recursos.");
        Set<Long> permitidos = locais.findById(f.localId()).map(Local::getRecursos).orElse(Set.of())
                .stream().map(Recurso::getId).collect(Collectors.toSet());
        return permitidos.containsAll(f.recursoIdsOuVazio())
                ? List.of() : List.of("Algum recurso marcado não está disponível no local escolhido.");
    }

    /** Cria ou atualiza o evento com os dados do formulário e o novo status. */
    @Transactional
    public Evento salvar(Evento ev, EventoForm f, Status novoStatus) {
        ev.setNome(texto(f.nome()));
        ev.setTema(f.temaId() == null ? null : temas.findById(f.temaId()).orElse(null));
        ev.setData(f.data());
        ev.setHoraInicio(f.horaInicio());
        ev.setHoraFim(f.horaFim());
        ev.setLocal(f.localId() == null ? null : locais.findById(f.localId()).orElse(null));
        ev.setCurso(f.cursoId() == null ? null : cursos.findById(f.cursoId()).orElse(null));
        ev.setSolicitante(texto(f.solicitante()));
        ev.setPalestrante(texto(f.palestrante()));
        ev.setPublicoAlvo(texto(f.publicoAlvo()));
        ev.setPublicoEstimado(f.publicoEstimado());
        ev.setJustificativa(texto(f.justificativa()));
        ev.setObjetivo(texto(f.objetivo()));
        ev.setCerimonial(f.cerimonial());
        ev.setInscricoes(f.inscricoes());
        ev.setDeclaracoes(f.declaracoes());
        ev.setObservacoes(texto(f.observacoes()));
        ev.setRecursos(new HashSet<>(recursos.findAllById(f.recursoIdsOuVazio())));
        ev.setStatus(novoStatus);
        return eventos.save(ev);
    }

    /** Solicitante: "salvar" = rascunho; "enviar" = validação completa e vai para análise. */
    @Transactional
    public Evento gravarPeloSolicitante(Evento ev, EventoForm f, boolean enviar, String quem) {
        boolean novo = ev.getId() == null;
        Status anterior = ev.getStatus();
        List<String> erros = enviar ? validarEnvio(f, ev.getId()) : validarRascunho(f);
        if (!erros.isEmpty()) throw new RegraNegocioException(erros);
        Evento salvo = salvar(ev, f, enviar ? Status.AGUARDANDO : Status.RASCUNHO);
        if (novo) registrar(salvo, "CRIADO", null, quem);
        if (enviar) registrar(salvo, anterior == Status.REJEITADO ? "REENVIADO" : "ENVIADO", null, quem);
        else if (!novo) registrar(salvo, "EDITADO", "Rascunho atualizado", quem);
        return salvo;
    }

    /** Admin edita um evento já aprovado: valida tudo e confere conflito de novo. */
    @Transactional
    public Evento editarAprovado(Evento ev, EventoForm f, String quem) {
        if (ev.getStatus() != Status.APROVADO) throw new RegraNegocioException("Somente eventos aprovados são editados aqui.");
        if (f.localId() != null) locais.travar(f.localId());
        List<String> erros = validarEnvio(f, ev.getId());
        if (!erros.isEmpty()) throw new RegraNegocioException(erros);
        Evento salvo = salvar(ev, f, Status.APROVADO);
        registrar(salvo, "EDITADO", "Evento aprovado alterado pela administração", quem);
        return salvo;
    }

    public Evento novo(Usuario autor) {
        Evento ev = new Evento();
        ev.setAutor(autor);
        return ev;
    }

    /** APROVAR: revalida tudo, porque outro evento pode ter sido aprovado depois do envio. */
    @Transactional
    public Evento aprovar(Evento ev, String quem) {
        exigirStatus(ev, Status.AGUARDANDO, "Só é possível aprovar solicitações aguardando aprovação.");
        // Trava o local: se dois admins aprovarem ao mesmo tempo, o segundo espera e vê o conflito
        if (ev.getLocal() != null) locais.travar(ev.getLocal().getId());
        List<String> erros = validarEnvio(EventoForm.de(ev), ev.getId());
        if (!erros.isEmpty()) throw new RegraNegocioException(erros);
        ev.setStatus(Status.APROVADO);
        ev.setMotivoRejeicao(null);
        registrar(ev, "APROVADO", "Publicado na agenda", quem);
        return eventos.save(ev);
    }

    /** REJEITAR: justificativa obrigatória, visível ao autor. */
    @Transactional
    public Evento rejeitar(Evento ev, String motivo, String quem) {
        exigirStatus(ev, Status.AGUARDANDO, "Só é possível rejeitar solicitações aguardando aprovação.");
        if (vazio(motivo)) throw new RegraNegocioException("Escreva o motivo da rejeição.");
        ev.setStatus(Status.REJEITADO);
        ev.setMotivoRejeicao(motivo.trim());
        registrar(ev, "REJEITADO", motivo.trim(), quem);
        return eventos.save(ev);
    }

    @Transactional
    public Evento cancelar(Evento ev, Status statusExigido, String mensagem, String quem) {
        exigirStatus(ev, statusExigido, mensagem);
        ev.setStatus(Status.CANCELADO);
        registrar(ev, "CANCELADO", null, quem);
        return eventos.save(ev);
    }

    @Transactional
    public void excluirRascunho(Evento ev) {
        exigirStatus(ev, Status.RASCUNHO, "Só é possível excluir rascunhos.");
        eventos.delete(ev);
    }

    /** Grava uma linha na linha do tempo da solicitação. */
    public void registrar(Evento ev, String acao, String detalhe, String quem) {
        EventoHistorico h = new EventoHistorico();
        h.setEvento(ev);
        h.setAcao(acao);
        h.setDetalhe(detalhe);
        h.setUsuarioNome(quem);
        historico.save(h);
    }

    private void exigirStatus(Evento ev, Status status, String mensagem) {
        if (ev.getStatus() != status) throw new RegraNegocioException(mensagem);
    }

    private static boolean vazio(String s) { return s == null || s.isBlank(); }

    private static String texto(String s) { return vazio(s) ? null : s.trim(); }
}
