package br.univille.agendauni.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import br.univille.agendauni.exception.RegraNegocioException;
import br.univille.agendauni.model.Evento;
import br.univille.agendauni.model.EventoImagem;
import br.univille.agendauni.repository.EventoImagemRepository;

/** Arte (imagem) opcional do evento: validação e gravação no banco. */
@Service
public class ImagemService {

    private static final Set<String> TIPOS = Set.of("image/png", "image/jpeg", "image/webp");
    private static final long MAXIMO = 5 * 1024 * 1024; // 5 MB

    private final EventoImagemRepository imagens;
    private final EventoService eventos;

    public ImagemService(EventoImagemRepository imagens, EventoService eventos) {
        this.imagens = imagens;
        this.eventos = eventos;
    }

    @Transactional
    public void salvar(Evento ev, MultipartFile arquivo, String quem) throws IOException {
        if (arquivo == null || arquivo.isEmpty()) throw new RegraNegocioException("Escolha uma imagem.");
        if (!TIPOS.contains(arquivo.getContentType())) throw new RegraNegocioException("Use uma imagem JPG, PNG ou WEBP.");
        if (arquivo.getSize() > MAXIMO) throw new RegraNegocioException("A imagem deve ter no máximo 5 MB.");

        EventoImagem img = imagens.findById(ev.getId()).orElseGet(EventoImagem::new);
        img.setEventoId(ev.getId());
        img.setTipo(arquivo.getContentType());
        img.setDados(arquivo.getBytes());
        img.setAtualizadoEm(LocalDateTime.now());
        imagens.save(img);
        eventos.registrar(ev, "IMAGEM", "Arte do evento anexada", quem);
    }

    @Transactional
    public void remover(Evento ev, String quem) {
        if (imagens.existsById(ev.getId())) {
            imagens.deleteById(ev.getId());
            eventos.registrar(ev, "IMAGEM", "Arte do evento removida", quem);
        }
    }
}
