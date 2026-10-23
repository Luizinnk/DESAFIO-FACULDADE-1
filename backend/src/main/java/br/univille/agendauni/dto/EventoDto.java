package br.univille.agendauni.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;

import br.univille.agendauni.model.Evento;
import br.univille.agendauni.model.EventoHistorico;
import br.univille.agendauni.model.Recurso;

/** Evento completo, como a tela de detalhe e o formulário precisam. */
public record EventoDto(
        Long id, String nome, Long temaId, String tema,
        LocalDate data,
        @JsonFormat(pattern = "HH:mm") LocalTime horaInicio,
        @JsonFormat(pattern = "HH:mm") LocalTime horaFim,
        Long localId, String local, Integer capacidadeLocal,
        Long cursoId, String curso, String centroCusto,
        String solicitante, String autor, String palestrante, String publicoAlvo, Integer publicoEstimado,
        String justificativa, String objetivo,
        Boolean cerimonial, Boolean inscricoes, Boolean declaracoes, String observacoes,
        List<Long> recursoIds, List<String> recursos,
        String status, String motivoRejeicao,
        @JsonFormat(pattern = "dd/MM/yyyy HH:mm") LocalDateTime atualizadoEm,
        String imagem,                 // endereço da arte do evento (null = sem imagem)
        List<Historico> historico) {

    public record Historico(String acao, String detalhe, String usuario,
                            @JsonFormat(pattern = "dd/MM/yyyy 'às' HH:mm") LocalDateTime dataHora) {
        public static Historico de(EventoHistorico h) {
            return new Historico(h.getAcao(), h.getDetalhe(), h.getUsuarioNome(), h.getDataHora());
        }
    }

    public static EventoDto de(Evento e) { return de(e, null, List.of()); }

    public static EventoDto de(Evento e, String imagem, List<Historico> historico) {
        List<Recurso> recs = e.getRecursos().stream().sorted(Comparator.comparing(Recurso::getNome)).toList();
        return new EventoDto(e.getId(), e.getNome(),
                e.getTema() == null ? null : e.getTema().getId(), e.getTema() == null ? null : e.getTema().getNome(),
                e.getData(), e.getHoraInicio(), e.getHoraFim(),
                e.getLocal() == null ? null : e.getLocal().getId(), e.getLocal() == null ? null : e.getLocal().getNome(),
                e.getLocal() == null ? null : e.getLocal().getCapacidade(),
                e.getCurso() == null ? null : e.getCurso().getId(), e.getCurso() == null ? null : e.getCurso().getNome(),
                e.getCurso() == null ? null : e.getCurso().getCentroCusto().getDescricao(),
                e.getSolicitante(), e.getAutor().getNome(), e.getPalestrante(), e.getPublicoAlvo(), e.getPublicoEstimado(),
                e.getJustificativa(), e.getObjetivo(), e.getCerimonial(), e.getInscricoes(), e.getDeclaracoes(),
                e.getObservacoes(), recs.stream().map(Recurso::getId).toList(), recs.stream().map(Recurso::getNome).toList(),
                e.getStatus().name(), e.getMotivoRejeicao(), e.getAtualizadoEm(), imagem, historico);
    }
}
