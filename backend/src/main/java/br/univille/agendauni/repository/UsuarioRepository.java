package br.univille.agendauni.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import br.univille.agendauni.model.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmailIgnoreCase(String email);
}
