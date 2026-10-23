package br.univille.agendauni.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import br.univille.agendauni.config.UsuarioSessao;
import br.univille.agendauni.exception.RegraNegocioException;
import br.univille.agendauni.model.Usuario;
import br.univille.agendauni.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UsuarioRepository usuarios;
    private final BCryptPasswordEncoder encoder;

    public AuthController(UsuarioRepository usuarios, BCryptPasswordEncoder encoder) {
        this.usuarios = usuarios;
        this.encoder = encoder;
    }

    record Login(String email, String senha) {}

    @PostMapping("/login")
    public UsuarioSessao login(@RequestBody Login dados, HttpServletRequest req) {
        String email = dados.email() == null ? "" : dados.email().trim();
        Usuario u = usuarios.findByEmailIgnoreCase(email).orElse(null);
        // Mesma mensagem para e-mail ou senha errados: não revela qual dos dois falhou
        if (u == null || dados.senha() == null || !encoder.matches(dados.senha(), u.getSenhaHash())) {
            throw new RegraNegocioException("E-mail ou senha incorretos.");
        }
        if (!u.isAtivo()) throw new RegraNegocioException("Seu acesso está desativado. Procure o setor de Eventos.");

        // Nova sessão a cada login (evita reaproveitar sessão antiga)
        HttpSession antiga = req.getSession(false);
        if (antiga != null) antiga.invalidate();
        UsuarioSessao sessao = new UsuarioSessao(u.getId(), u.getNome(), u.getEmail(), u.getPerfil().name());
        req.getSession(true).setAttribute(UsuarioSessao.ATRIBUTO, sessao);
        return sessao;
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest req) {
        HttpSession s = req.getSession(false);
        if (s != null) s.invalidate();
        return ResponseEntity.noContent().build();
    }

    /** Quem está logado agora (o front chama ao abrir a página). */
    @GetMapping("/eu")
    public Map<String, Object> eu(HttpServletRequest req) {
        HttpSession s = req.getSession(false);
        Object u = s == null ? null : s.getAttribute(UsuarioSessao.ATRIBUTO);
        return u == null ? Map.of() : Map.of("usuario", u);
    }
}
