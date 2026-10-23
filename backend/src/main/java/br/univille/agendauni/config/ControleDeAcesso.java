package br.univille.agendauni.config;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

/**
 * Roda antes de cada chamada à API.
 * - /api/publico e /api/auth: livres
 * - /api/admin: só ADMIN
 * - o resto: qualquer usuário logado
 */
@Component
public class ControleDeAcesso implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) throws Exception {
        String caminho = req.getRequestURI();
        if (caminho.startsWith("/api/publico") || caminho.startsWith("/api/auth")) return true;

        HttpSession sessao = req.getSession(false);
        UsuarioSessao usuario = sessao == null ? null : (UsuarioSessao) sessao.getAttribute(UsuarioSessao.ATRIBUTO);
        if (usuario == null) return negar(res, 401, "Faça login para continuar.");
        if (caminho.startsWith("/api/admin") && !usuario.isAdmin()) {
            return negar(res, 403, "Acesso permitido somente ao administrador.");
        }
        return true;
    }

    private boolean negar(HttpServletResponse res, int status, String mensagem) throws Exception {
        res.setStatus(status);
        res.setContentType("application/json;charset=UTF-8");
        res.getWriter().write("{\"erros\":[\"" + mensagem + "\"]}");
        return false;
    }
}
