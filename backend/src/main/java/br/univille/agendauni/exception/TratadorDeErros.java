package br.univille.agendauni.exception;

import java.util.List;
import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Converte exceções em respostas JSON padronizadas: { "erros": [ ... ] } */
@RestControllerAdvice
public class TratadorDeErros {

    @ExceptionHandler(RegraNegocioException.class)
    ResponseEntity<Map<String, List<String>>> regra(RegraNegocioException e) {
        return ResponseEntity.badRequest().body(Map.of("erros", e.getErros()));
    }

    @ExceptionHandler(NaoEncontradoException.class)
    ResponseEntity<Map<String, List<String>>> naoEncontrado(NaoEncontradoException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("erros", List.of(e.getMessage())));
    }

    // O banco recusou: chave estrangeira (cadastro em uso) ou valor repetido (UNIQUE)
    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<Map<String, List<String>>> integridade(DataIntegrityViolationException e) {
        String detalhe = String.valueOf(e.getMostSpecificCause().getMessage()).toLowerCase();
        String msg = detalhe.contains("foreign key")
                ? "Não é possível excluir: este cadastro está sendo usado por eventos ou outros cadastros."
                : detalhe.contains("duplicate key") || detalhe.contains("unique")
                ? "Já existe um cadastro com esse nome, código ou e-mail."
                : "Operação recusada pelo banco de dados.";
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("erros", List.of(msg)));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<Map<String, List<String>>> jsonInvalido(HttpMessageNotReadableException e) {
        return ResponseEntity.badRequest().body(Map.of("erros", List.of("Dados enviados em formato inválido.")));
    }
}
