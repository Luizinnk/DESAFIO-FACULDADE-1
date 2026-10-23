package br.univille.agendauni.service;

import java.awt.Color;
import java.awt.Font;
import java.awt.GradientPaint;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.HashSet;

import javax.imageio.ImageIO;

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
    private final BloqueioRepository bloqueios;
    private final EventoImagemRepository imagens;
    private final EventoService servico;

    @Value("${app.reset-dados:false}")
    private boolean resetar;

    public DadosIniciais(JdbcTemplate jdbc, BCryptPasswordEncoder encoder, UsuarioRepository usuarios,
                         CentroCustoRepository centros, CursoRepository cursos, TemaRepository temas,
                         LocalRepository locais, RecursoRepository recursos, EventoRepository eventos,
                         BloqueioRepository bloqueios, EventoImagemRepository imagens, EventoService servico) {
        this.jdbc = jdbc;
        this.encoder = encoder;
        this.usuarios = usuarios;
        this.centros = centros;
        this.cursos = cursos;
        this.temas = temas;
        this.locais = locais;
        this.recursos = recursos;
        this.eventos = eventos;
        this.bloqueios = bloqueios;
        this.imagens = imagens;
        this.servico = servico;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (resetar) {
            jdbc.execute("TRUNCATE evento_imagens, evento_historico, bloqueios, evento_recursos, eventos, local_recursos, recursos, locais, temas, cursos, "
                    + "centros_custo, usuarios RESTART IDENTITY CASCADE");
            log.info("Dados apagados (app.reset-dados=true).");
        } else if (usuarios.count() > 0) {
            return;
        }

        Usuario admin = usuario("Ana Administradora", "admin@teste.com", "admin123", Perfil.ADMIN);
        Usuario carlos = usuario("Carlos Solicitante", "carlos@teste.com", "carlos123", Perfil.SOLICITANTE);
        Usuario bia = usuario("Beatriz Solicitante", "bia@teste.com", "bia12345", Perfil.SOLICITANTE);

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

        Local auditorio = local("Auditório A", 300, projetor, microfone, som, coffee);
        Local mini = local("Miniauditório", 120, projetor, microfone, som);
        Local sala = local("Sala 213", 40, projetor);
        Local lab = local("Laboratório 5", 30, projetor, computadores);

        // Bloqueio de exemplo: o laboratório fica em manutenção (por isso o Hackathon foi rejeitado)
        Bloqueio manutencao = new Bloqueio();
        manutencao.setLocal(lab);
        manutencao.setDataInicio(LocalDate.now().plusDays(14));
        manutencao.setDataFim(LocalDate.now().plusDays(16));
        manutencao.setMotivo("Manutenção dos computadores");
        bloqueios.save(manutencao);

        Evento ia = evento(carlos, "Prof. Carlos Lima", "Palestra: IA na Engenharia", palestra, 3, "19:00", "20:00", auditorio, software, "Dra. Marina Souza", Status.APROVADO, null, projetor, microfone);
        anexarArte(ia, "Palestra: IA na Engenharia", "Dra. Marina Souza · Auditório A");
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

    private Local local(String nome, int capacidade, Recurso... disponiveis) {
        Local l = new Local();
        l.setNome(nome);
        l.setCapacidade(capacidade);
        l.setRecursos(new HashSet<>(List.of(disponiveis)));
        return locais.save(l);
    }

    private Evento evento(Usuario autor, String solicitante, String nome, Tema tema, int diasAPartirDeHoje,
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
        e.setPublicoEstimado(Math.min(80, local.getCapacidade()));
        eventos.save(e);

        // Linha do tempo coerente com o status atual
        servico.registrar(e, "CRIADO", null, autor.getNome());
        if (status != Status.RASCUNHO) servico.registrar(e, "ENVIADO", null, autor.getNome());
        if (status == Status.APROVADO) servico.registrar(e, "APROVADO", "Publicado na agenda", "Ana Administradora");
        if (status == Status.REJEITADO) servico.registrar(e, "REJEITADO", motivo, "Ana Administradora");
        if (status == Status.CANCELADO) servico.registrar(e, "CANCELADO", null, autor.getNome());
        return e;
    }

    /** Gera uma arte simples (verde Univille + título) para mostrar a imagem no card. */
    private void anexarArte(Evento e, String titulo, String subtitulo) {
        try {
            BufferedImage img = new BufferedImage(1200, 630, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = img.createGraphics();
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
            g.setPaint(new GradientPaint(0, 0, new Color(0x00, 0x4f, 0x2d), 1200, 630, new Color(0x0b, 0x7a, 0x45)));
            g.fillRect(0, 0, 1200, 630);
            g.setColor(new Color(0x8c, 0xc6, 0x3f, 150));
            g.fillOval(820, -160, 520, 520);
            g.setColor(new Color(0x8c, 0xc6, 0x3f, 70));
            g.fillOval(700, 380, 420, 420);
            g.setColor(Color.WHITE);
            g.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 30));
            g.drawString("AGENDAUNI · EVENTOS UNIVILLE", 80, 130);
            g.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 72));
            g.drawString(titulo, 80, 330);
            g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 38));
            g.drawString(subtitulo, 80, 410);
            g.dispose();
            ByteArrayOutputStream saida = new ByteArrayOutputStream();
            ImageIO.write(img, "png", saida);

            EventoImagem arte = new EventoImagem();
            arte.setEventoId(e.getId());
            arte.setTipo("image/png");
            arte.setDados(saida.toByteArray());
            imagens.save(arte);
        } catch (Exception erro) {
            log.warn("Não foi possível gerar a arte de exemplo: {}", erro.getMessage());
        }
    }
}
