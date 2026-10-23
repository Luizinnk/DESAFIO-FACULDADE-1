package br.univille.agendauni.controller;

import java.util.Comparator;
import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import br.univille.agendauni.model.Recurso;
import br.univille.agendauni.repository.CursoRepository;
import br.univille.agendauni.repository.LocalRepository;
import br.univille.agendauni.repository.TemaRepository;

/** Listas que preenchem o formulário de solicitação. */
@RestController
public class OpcoesController {

    private final TemaRepository temas;
    private final LocalRepository locais;
    private final CursoRepository cursos;

    public OpcoesController(TemaRepository temas, LocalRepository locais, CursoRepository cursos) {
        this.temas = temas;
        this.locais = locais;
        this.cursos = cursos;
    }

    record Item(Long id, String nome) {}
    record LocalOpcao(Long id, String nome, List<Item> recursos) {}
    record CursoOpcao(Long id, String nome, String centroCusto) {}
    record Opcoes(List<Item> temas, List<LocalOpcao> locais, List<CursoOpcao> cursos) {}

    @GetMapping("/api/opcoes")
    public Opcoes opcoes() {
        Sort porNome = Sort.by("nome");
        return new Opcoes(
                temas.findAll(porNome).stream().map(t -> new Item(t.getId(), t.getNome())).toList(),
                locais.findAll(porNome).stream().map(l -> new LocalOpcao(l.getId(), l.getNome(),
                        l.getRecursos().stream().sorted(Comparator.comparing(Recurso::getNome))
                                .map(r -> new Item(r.getId(), r.getNome())).toList())).toList(),
                cursos.findAll(porNome).stream()
                        .map(c -> new CursoOpcao(c.getId(), c.getNome(), c.getCentroCusto().getDescricao())).toList());
    }
}
