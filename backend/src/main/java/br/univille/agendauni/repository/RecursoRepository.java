package br.univille.agendauni.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.univille.agendauni.model.Recurso;

public interface RecursoRepository extends JpaRepository<Recurso, Long> {
}
