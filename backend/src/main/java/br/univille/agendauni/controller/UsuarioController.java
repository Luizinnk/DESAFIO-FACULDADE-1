package br.univille.agendauni.controller;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import br.univille.agendauni.config.UsuarioSessao;
import br.univille.agendauni.exception.NaoEncontradoException;
import br.univille.agendauni.exception.RegraNegocioException;
import br.univille.agendauni.model.Perfil;
import br.univille.agendauni.model.Usuario;
import br.univille.agendauni.repository.UsuarioRepository;

/** ADMINISTRADOR: cadastrar, editar e desativar usuários (não há autocadastro). */
@RestController
@RequestMapping("/api/admin/usuarios")
public class UsuarioController {

    private final UsuarioRepository usuarios;
    private final BCryptPasswordEncoder encoder;

    public UsuarioController(UsuarioRepository usuarios, BCryptPasswordEncoder encoder) {
        this.usuarios = usuarios;
        this.encoder = encoder;
    }

    record UsuarioDto(Long id, String nome, String email, String perfil, boolean ativo) {
        static UsuarioDto de(Usuario u) { return new UsuarioDto(u.getId(), u.getNome(), u.getEmail(), u.getPerfil().name(), u.isAtivo()); }
    }

    record Form(String nome, String email, String senha, String perfil) {}

    @GetMapping
    public List<UsuarioDto> listar() {
        return usuarios.findAll(Sort.by("nome")).stream().map(UsuarioDto::de).toList();
    }

    @PostMapping
    public UsuarioDto criar(@RequestBody Form f) {
        return UsuarioDto.de(salvar(new Usuario(), f, true));
    }

    @PutMapping("/{id}")
    public UsuarioDto atualizar(@PathVariable Long id, @RequestBody Form f) {
        return UsuarioDto.de(salvar(buscar(id), f, false));
    }

    /** Ativar/desativar. Usuários não são apagados porque são autores de eventos. */
    @PostMapping("/{id}/ativo")
    public UsuarioDto alternarAtivo(@PathVariable Long id, @SessionAttribute(UsuarioSessao.ATRIBUTO) UsuarioSessao eu) {
        if (id.equals(eu.id())) throw new RegraNegocioException("Você não pode desativar o seu próprio acesso.");
        Usuario u = buscar(id);
        u.setAtivo(!u.isAtivo());
        return UsuarioDto.de(usuarios.save(u));
    }

    private Usuario salvar(Usuario u, Form f, boolean novo) {
        if (f.nome() == null || f.nome().isBlank() || f.email() == null || f.email().isBlank()) {
            throw new RegraNegocioException("Preencha o nome e o e-mail.");
        }
        if (novo && (f.senha() == null || f.senha().isBlank())) throw new RegraNegocioException("Defina uma senha.");
        if (f.senha() != null && !f.senha().isBlank()) {
            validarSenha(f.senha());
            u.setSenhaHash(encoder.encode(f.senha()));   // senha só muda se uma nova for digitada
        }
        u.setNome(f.nome().trim());
        u.setEmail(f.email().trim().toLowerCase());
        u.setPerfil("ADMIN".equals(f.perfil()) ? Perfil.ADMIN : Perfil.SOLICITANTE);
        return usuarios.saveAndFlush(u);
    }

    /** Senha forte o suficiente: 8+ caracteres, com letra e número. */
    static void validarSenha(String senha) {
        if (senha == null || senha.length() < 8 || !senha.matches(".*[A-Za-z].*") || !senha.matches(".*\\d.*")) {
            throw new RegraNegocioException("A senha precisa ter pelo menos 8 caracteres, com letras e números.");
        }
    }

    private Usuario buscar(Long id) {
        return usuarios.findById(id).orElseThrow(() -> new NaoEncontradoException("Usuário não encontrado."));
    }
}
