package br.univille.agendauni.controller;

import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import br.univille.agendauni.exception.NaoEncontradoException;
import br.univille.agendauni.exception.RegraNegocioException;
import br.univille.agendauni.model.*;
import br.univille.agendauni.repository.*;

/**
 * Cadastros auxiliares do ADMINISTRADOR: temas, recursos, centros de custo, cursos e locais.
 * Uma única rota para todos: /api/admin/cadastros/{tipo}
 * A exclusão de algo em uso é recusada pelo próprio banco (chave estrangeira).
 */
@RestController
@RequestMapping("/api/admin/cadastros/{tipo}")
public class CadastroController {

    private final TemaRepository temas;
    private final RecursoRepository recursos;
    private final CentroCustoRepository centros;
    private final CursoRepository cursos;
    private final LocalRepository locais;

    public CadastroController(TemaRepository temas, RecursoRepository recursos, CentroCustoRepository centros,
                              CursoRepository cursos, LocalRepository locais) {
        this.temas = temas;
        this.recursos = recursos;
        this.centros = centros;
        this.cursos = cursos;
        this.locais = locais;
    }

    /** Campos possíveis; cada tipo usa só os que precisa. */
    record Form(String nome, String codigo, Long centroCustoId, List<Long> recursoIds, Integer capacidade) {}

    @GetMapping
    public List<Map<String, Object>> listar(@PathVariable String tipo) {
        Sort porNome = Sort.by("nome");
        return switch (tipo) {
            case "temas" -> temas.findAll(porNome).stream().map(t -> linha(t.getId(), t.getNome())).toList();
            case "recursos" -> recursos.findAll(porNome).stream().map(r -> linha(r.getId(), r.getNome())).toList();
            case "centros-custo" -> centros.findAll(Sort.by("codigo")).stream().map(c -> {
                Map<String, Object> m = linha(c.getId(), c.getNome());
                m.put("codigo", c.getCodigo());
                return m;
            }).toList();
            case "cursos" -> cursos.findAll(porNome).stream().map(c -> {
                Map<String, Object> m = linha(c.getId(), c.getNome());
                m.put("centroCustoId", c.getCentroCusto().getId());
                m.put("centroCusto", c.getCentroCusto().getDescricao());
                return m;
            }).toList();
            case "locais" -> locais.findAll(porNome).stream().map(l -> {
                List<Recurso> recs = l.getRecursos().stream().sorted(Comparator.comparing(Recurso::getNome)).toList();
                Map<String, Object> m = linha(l.getId(), l.getNome());
                m.put("recursoIds", recs.stream().map(Recurso::getId).toList());
                m.put("recursos", String.join(", ", recs.stream().map(Recurso::getNome).toList()));
                m.put("capacidade", l.getCapacidade());
                return m;
            }).toList();
            default -> throw new NaoEncontradoException("Cadastro inexistente.");
        };
    }

    @PostMapping
    @Transactional
    public Map<String, Object> criar(@PathVariable String tipo, @RequestBody Form f) {
        return salvar(tipo, null, f);
    }

    @PutMapping("/{id}")
    @Transactional
    public Map<String, Object> atualizar(@PathVariable String tipo, @PathVariable Long id, @RequestBody Form f) {
        return salvar(tipo, id, f);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable String tipo, @PathVariable Long id) {
        switch (tipo) {
            case "temas" -> { temas.deleteById(id); temas.flush(); }
            case "recursos" -> { recursos.deleteById(id); recursos.flush(); }
            case "centros-custo" -> { centros.deleteById(id); centros.flush(); }
            case "cursos" -> { cursos.deleteById(id); cursos.flush(); }
            case "locais" -> { locais.deleteById(id); locais.flush(); }
            default -> throw new NaoEncontradoException("Cadastro inexistente.");
        }
        return ResponseEntity.noContent().build();
    }

    private Map<String, Object> salvar(String tipo, Long id, Form f) {
        String nome = obrigatorio(f.nome(), "Preencha o nome.");
        // Impede duplicado mesmo com maiúsculas/acentos diferentes ("AUDITORIO A" = "Auditório A")
        boolean repetido = listar(tipo).stream().anyMatch(m -> !((Long) m.get("id")).equals(id)
                && normalizar((String) m.get("nome")).equals(normalizar(nome)));
        if (repetido) throw new RegraNegocioException("Já existe um cadastro chamado \"" + nome + "\" (mesmo com acento ou maiúsculas diferentes).");
        switch (tipo) {
            case "temas" -> {
                Tema t = id == null ? new Tema() : temas.findById(id).orElseThrow(this::naoEncontrado);
                t.setNome(nome);
                temas.saveAndFlush(t);
            }
            case "recursos" -> {
                Recurso r = id == null ? new Recurso() : recursos.findById(id).orElseThrow(this::naoEncontrado);
                r.setNome(nome);
                recursos.saveAndFlush(r);
            }
            case "centros-custo" -> {
                CentroCusto c = id == null ? new CentroCusto() : centros.findById(id).orElseThrow(this::naoEncontrado);
                c.setNome(nome);
                c.setCodigo(obrigatorio(f.codigo(), "Preencha o código."));
                centros.saveAndFlush(c);
            }
            case "cursos" -> {
                Curso c = id == null ? new Curso() : cursos.findById(id).orElseThrow(this::naoEncontrado);
                c.setNome(nome);
                if (f.centroCustoId() == null) throw new RegraNegocioException("Escolha o centro de custo.");
                c.setCentroCusto(centros.findById(f.centroCustoId()).orElseThrow(this::naoEncontrado));
                cursos.saveAndFlush(c);
            }
            case "locais" -> {
                Local l = id == null ? new Local() : locais.findById(id).orElseThrow(this::naoEncontrado);
                l.setNome(nome);
                if (f.capacidade() != null && f.capacidade() < 1) throw new RegraNegocioException("A capacidade deve ser maior que zero.");
                l.setCapacidade(f.capacidade());
                l.setRecursos(new HashSet<>(recursos.findAllById(f.recursoIds() == null ? List.of() : f.recursoIds())));
                locais.saveAndFlush(l);
            }
            default -> throw new NaoEncontradoException("Cadastro inexistente.");
        }
        return Map.of("ok", true);
    }

    /** "Auditório  A" -> "auditorio a": sem acento, minúsculo e sem espaços repetidos. */
    static String normalizar(String texto) {
        return java.text.Normalizer.normalize(texto, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").toLowerCase().trim().replaceAll("\\s+", " ");
    }

    private static Map<String, Object> linha(Long id, String nome) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);
        m.put("nome", nome);
        return m;
    }

    private static String obrigatorio(String valor, String mensagem) {
        if (valor == null || valor.isBlank()) throw new RegraNegocioException(mensagem);
        return valor.trim();
    }

    private NaoEncontradoException naoEncontrado() { return new NaoEncontradoException("Cadastro não encontrado."); }
}
