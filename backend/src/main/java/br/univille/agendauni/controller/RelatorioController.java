package br.univille.agendauni.controller;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import br.univille.agendauni.dto.EventoDto;
import br.univille.agendauni.model.Evento;
import br.univille.agendauni.model.Status;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;

/** Relatório do ADMINISTRADOR com filtros combináveis e exportação CSV. */
@RestController
@RequestMapping("/api/admin/relatorio")
public class RelatorioController {

    private final EntityManager em;

    public RelatorioController(EntityManager em) { this.em = em; }

    /** Monta a consulta só com os filtros que foram preenchidos. */
    private List<EventoDto> consultar(LocalDate dataInicio, LocalDate dataFim, Long cursoId, Long temaId, Status status) {
        List<String> where = new ArrayList<>(List.of("e.status <> br.univille.agendauni.model.Status.RASCUNHO"));
        Map<String, Object> params = new HashMap<>();
        if (dataInicio != null) { where.add("e.data >= :dataInicio"); params.put("dataInicio", dataInicio); }
        if (dataFim != null) { where.add("e.data <= :dataFim"); params.put("dataFim", dataFim); }
        if (cursoId != null) { where.add("e.curso.id = :cursoId"); params.put("cursoId", cursoId); }
        if (temaId != null) { where.add("e.tema.id = :temaId"); params.put("temaId", temaId); }
        if (status != null) { where.add("e.status = :status"); params.put("status", status); }

        String jpql = "SELECT e FROM Evento e WHERE " + String.join(" AND ", where) + " ORDER BY e.data, e.horaInicio";
        TypedQuery<Evento> q = em.createQuery(jpql, Evento.class);
        params.forEach(q::setParameter);
        return q.getResultList().stream().map(EventoDto::de).toList();
    }

    @GetMapping
    public List<EventoDto> relatorio(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
                                     @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
                                     @RequestParam(required = false) Long cursoId,
                                     @RequestParam(required = false) Long temaId,
                                     @RequestParam(required = false) Status status) {
        return consultar(dataInicio, dataFim, cursoId, temaId, status);
    }

    /** Mesmos filtros e mesmos campos da tela. Separador ";" e BOM para abrir certo no Excel. */
    @GetMapping("/csv")
    public ResponseEntity<byte[]> csv(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
                                      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
                                      @RequestParam(required = false) Long cursoId,
                                      @RequestParam(required = false) Long temaId,
                                      @RequestParam(required = false) Status status) {
        DateTimeFormatter br = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        String cabecalho = linha("Evento", "Data", "Início", "Término", "Tema", "Curso/Coordenação",
                "Centro de custo", "Local", "Solicitante", "Status");
        String corpo = consultar(dataInicio, dataFim, cursoId, temaId, status).stream()
                .map(e -> linha(e.nome(), e.data().format(br), String.valueOf(e.horaInicio()), String.valueOf(e.horaFim()),
                        e.tema(), e.curso(), e.centroCusto(), e.local(), e.solicitante(), e.status()))
                .collect(Collectors.joining("\r\n"));
        byte[] conteudo = ("﻿" + cabecalho + "\r\n" + corpo).getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"relatorio-eventos.csv\"")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(conteudo);
    }

    private static String linha(String... valores) {
        return Stream.of(valores).map(v -> "\"" + (v == null ? "" : v.replace("\"", "\"\"")) + "\"")
                .collect(Collectors.joining(";"));
    }
}
