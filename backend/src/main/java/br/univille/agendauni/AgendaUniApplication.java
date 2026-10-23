package br.univille.agendauni;

import java.util.TimeZone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AgendaUniApplication {

    public static void main(String[] args) {
        // Datas e horários sempre no fuso de Joinville/São Bento do Sul
        TimeZone.setDefault(TimeZone.getTimeZone("America/Sao_Paulo"));
        SpringApplication.run(AgendaUniApplication.class, args);
    }
}
