package br.univille.agendauni.exception;

import java.util.List;

/** Erro de validação ou regra de negócio: vira HTTP 400 com a lista de mensagens. */
public class RegraNegocioException extends RuntimeException {
    private final List<String> erros;

    public RegraNegocioException(List<String> erros) {
        super(String.join(" ", erros));
        this.erros = erros;
    }

    public RegraNegocioException(String erro) { this(List.of(erro)); }

    public List<String> getErros() { return erros; }
}
