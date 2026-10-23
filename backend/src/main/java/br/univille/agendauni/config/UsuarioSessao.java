package br.univille.agendauni.config;

import java.io.Serializable;

/** O que fica guardado na sessão depois do login. */
public record UsuarioSessao(Long id, String nome, String email, String perfil) implements Serializable {
    public static final String ATRIBUTO = "usuario";

    public boolean isAdmin() { return "ADMIN".equals(perfil); }
}
