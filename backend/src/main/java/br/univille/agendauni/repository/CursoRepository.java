package br.univille.agendauni.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.univille.agendauni.model.Curso;

public interface CursoRepository extends JpaRepository<Curso, Long> {
}
