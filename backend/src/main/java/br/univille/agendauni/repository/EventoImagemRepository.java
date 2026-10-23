package br.univille.agendauni.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.univille.agendauni.model.EventoImagem;

public interface EventoImagemRepository extends JpaRepository<EventoImagem, Long> {
}
