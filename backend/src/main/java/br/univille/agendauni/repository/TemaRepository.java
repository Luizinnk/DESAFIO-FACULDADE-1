package br.univille.agendauni.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.univille.agendauni.model.Tema;

public interface TemaRepository extends JpaRepository<Tema, Long> {
}
