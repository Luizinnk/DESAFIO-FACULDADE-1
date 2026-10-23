package br.univille.agendauni.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import br.univille.agendauni.model.EventoHistorico;

public interface EventoHistoricoRepository extends JpaRepository<EventoHistorico, Long> {
    List<EventoHistorico> findByEventoIdOrderByDataHoraAscIdAsc(Long eventoId);
}
