package br.univille.agendauni.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.HashSet;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import br.univille.agendauni.model.*;
import br.univille.agendauni.repository.*;

/**
 * Carrega dados FICTÍCIOS para a demonstração.
 * Roda na inicialização: se o banco estiver vazio (ou se app.reset-dados=true).
 * As datas são relativas a hoje, para a agenda pública sempre ter eventos.
 */
@Component
public class DadosIniciais implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DadosIniciais.class);

    private final JdbcTemplate jdbc;
    private final BCryptPasswordEncoder encoder;
    private final UsuarioRepository usuarios;
    private final CentroCustoRepository centros;
    private final CursoRepository cursos;
    private final TemaRepository temas;
    private final LocalRepository locais;
    private final RecursoRepository recursos;
    private final EventoRepository eventos;

    @Value("${app.reset-dados:false}")
    private boolean resetar;

    public DadosIniciais(JdbcTemplate jdbc, BCryptPasswordEncoder encoder, UsuarioRepository usuarios,
                         CentroCustoRepository centros, CursoRepository cursos, TemaRepository temas,
                         LocalRepository locais, RecursoRepository recursos, EventoRepository eventos) {
        this.jdbc = jdbc;
        this.encoder = encoder;
        this.usuarios = usuarios;
        this.centros = centros;
        this.cursos = cursos;
        this.temas = temas;
        this.locais = locais;
        this.recursos = recursos;
        this.eventos = eventos;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (resetar) {
            jdbc.execute("TRUNCATE evento_recursos, eventos, local_recursos, recursos, locais, temas, cursos, "
                    + "centros_custo, usuarios RESTART IDENTITY CASCADE");
            log.info("Dados apagados (app.reset-dados=true).");
        } else if (usuarios.count() > 0) {
            return;
        }

        Usuario admin = usuario("Ana Administradora", "admin@teste.com", "admin123", Perfil.ADMIN);
        Usuario carlos = usuario("Carlos Solicitante", "carlos@teste.com", "carlos123", Perfil.SOLICITANTE);
        Usuario bia = usuario("Beatriz Solicitante", "bia@teste.com", "bia123", Perfil.SOLICITANTE);

        CentroCusto engs = centro("CC-101", "Engenharias");
        CentroCusto comp = centro("CC-202", "Computação");
        CentroCusto saude = centro("CC-303", "Saúde");
        Curso software = curso("Engenharia de Software", comp);
        Curso mecanica = curso("Engenharia Mecânica", engs);
        Curso enfermagem = curso("Enfermagem", saude);

        Tema palestra = tema("Palestra");
        Tema congresso = tema("Congresso");
        Tema workshop = tema("Workshop");
        Tema semana = tema("Semana Acadêmica");

        Recurso projetor = recurso("Projetor");
        Recurso microfone = recurso("Microfone");
        Recurso som = recurso("Som");
        Recurso computadores = recurso("Computadores");
        Recurso coffee = recurso("Coffee break");

        Local auditorio = local("Auditório A", projetor, microfone, som, coffee);
        Local mini = local("Miniauditório", projetor, microfone, som);
        Local sala = local("Sala 213", projetor);
        Local lab = local("Laboratório 5", projetor, computadores);

        evento(carlos, "Prof. Carlos Lima", "Palestra: IA na Engenharia", palestra, 3, "19:00", "20:00", auditorio, software, "Dra. Marina Souza", Status.APROVADO, null, projetor, microfone);
        evento(bia, "Coord. Beatriz Ramos", "Semana da Enfermagem", semana, 10, "08:00", "12:00", mini, enfermagem, "Equipe de Saúde", Status.APROVADO, null, microfone);
        evento(carlos, "Prof. Carlos Lima", "Workshop de Git", workshop, 20, "14:00", "17:00", lab, software, "João Pereira", Status.APROVADO, null, computadores);
        evento(bia, "Coord. Beatriz Ramos", "Congresso de Mecânica", congresso, 5, "19:00", "22:00", auditorio, mecanica, "Dr. Paulo Mendes", Status.AGUARDANDO, null);
        // Conflita com a palestra aprovada (mesmo local e dia, 19:30 cai dentro de 19:00–20:00): ótimo para a demo
        evento(carlos, "Prof. Carlos Lima", "Bate-papo com egressos", palestra, 3, "19:30", "21:00", auditorio, software, "Ex-alunos", Status.RASCUNHO, null);
        evento(carlos, "Prof. Carlos Lima", "Hackathon interno", workshop, 15, "08:00", "18:00", lab, software, "Comissão", Status.REJEITADO, "Laboratório em manutenção nessa data. Escolha outro local.");
        evento(bia, "Coord. Beatriz Ramos", "Palestra cancelada", palestra, 7, "10:00", "11:00", sala, enfermagem, "Convidado", Status.CANCELADO, null);

        log.info("Dados fictícios carregados. Admin: {} / Solicitante: {}", admin.getEmail(), List.of(carlos.getEmail(), bia.getEmail()));
    }

    private Usuario usuario(String nome, String email, String senha, Perfil perfil) {
        Usuario u = new Usuario();
        u.setNome(nome);
        u.setEmail(email);
        u.setSenhaHash(encoder.encode(senha));
        u.setPerfil(perfil);
        return usuarios.save(u);
    }

    private CentroCusto centro(String codigo, String nome) {
        CentroCusto c = new CentroCusto();
        c.setCodigo(codigo);
        c.setNome(nome);
        return centros.save(c);
    }

    private Curso curso(String nome, CentroCusto centro) {
        Curso c = new Curso();
        c.setNome(nome);
        c.setCentroCusto(centro);
        return cursos.save(c);
    }

    private Tema tema(String nome) {
        Tema t = new Tema();
        t.setNome(nome);
        return temas.save(t);
    }

    private Recurso recurso(String nome) {
        Recurso r = new Recurso();
        r.setNome(nome);
        return recursos.save(r);
    }

    private Local local(String nome, Recurso... disponiveis) {
        Local l = new Local();
        l.setNome(nome);
        l.setRecursos(new HashSet<>(List.of(disponiveis)));
        return locais.save(l);
    }

    private void evento(Usuario autor, String solicitante, String nome, Tema tema, int diasAPartirDeHoje,
                        String inicio, String fim, Local local, Curso curso, String palestrante,
                        Status status, String motivo, Recurso... recs) {
        Evento e = new Evento();
        e.setAutor(autor);
        e.setSolicitante(solicitante);
        e.setNome(nome);
        e.setTema(tema);
        e.setData(LocalDate.now().plusDays(diasAPartirDeHoje));
        e.setHoraInicio(LocalTime.parse(inicio));
        e.setHoraFim(LocalTime.parse(fim));
        e.setLocal(local);
        e.setCurso(curso);
        e.setPalestrante(palestrante);
        e.setPublicoAlvo("Comunidade acadêmica");
        e.setJustificativa("Aproximar os estudantes do mercado de trabalho.");
        e.setObjetivo("Atualizar alunos e professores sobre o tema.");
        e.setCerimonial(true);
        e.setInscricoes(true);
        e.setDeclaracoes(false);
        e.setStatus(status);
        e.setMotivoRejeicao(motivo);
        e.setRecursos(new HashSet<>(List.of(recs)));
        eventos.save(e);
    }
}
