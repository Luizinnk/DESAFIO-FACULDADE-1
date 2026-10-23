package br.univille.agendauni.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.univille.agendauni.model.Evento;
import br.univille.agendauni.model.Status;

public interface EventoRepository extends JpaRepository<Evento, Long> {

    List<Evento> findByAutorIdOrderByAtualizadoEmDesc(Long autorId);

    List<Evento> findByStatusOrderByDataAscHoraInicioAsc(Status status);

    List<Evento> findByStatusAndDataBetweenOrderByDataAscHoraInicioAsc(Status status, LocalDate inicio, LocalDate fim);

    List<Evento> findByStatusInAndDataBetweenOrderByDataAscHoraInicioAsc(List<Status> status, LocalDate inicio, LocalDate fim);

    /** Eventos aprovados e pendentes de um local num dia (para mostrar a ocupação). */
    List<Evento> findByLocalIdAndDataAndStatusInOrderByHoraInicio(Long localId, LocalDate data, List<Status> status);

    long countByStatus(Status status);

    /**
     * REGRA DE CONFLITO: evento APROVADO, mesmo local, mesma data e horários sobrepostos.
     * Dois intervalos se sobrepõem quando: inicioExistente < fimNovo E fimExistente > inicioNovo.
     * Ex.: aprovado 19:00–20:00 -> pedido 19:30–21:00 conflita; pedido 20:00–21:00 não conflita.
     */
    @Query("""
            SELECT e FROM Evento e
            WHERE e.status = br.univille.agendauni.model.Status.APROVADO
              AND e.local.id = :localId
              AND e.data = :data
              AND e.id <> :ignorarId
              AND e.horaInicio < :fim
              AND e.horaFim > :inicio
            """)
    List<Evento> buscarConflitos(@Param("localId") Long localId, @Param("data") LocalDate data,
                                 @Param("inicio") LocalTime inicio, @Param("fim") LocalTime fim,
                                 @Param("ignorarId") Long ignorarId);

    default Optional<Evento> buscarConflito(Long localId, LocalDate data, LocalTime inicio, LocalTime fim, Long ignorarId) {
        return buscarConflitos(localId, data, inicio, fim, ignorarId == null ? 0L : ignorarId).stream().findFirst();
    }
}
