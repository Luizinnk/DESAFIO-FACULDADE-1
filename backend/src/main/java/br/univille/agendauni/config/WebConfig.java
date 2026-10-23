package br.univille.agendauni.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final ControleDeAcesso controleDeAcesso;

    public WebConfig(ControleDeAcesso controleDeAcesso) { this.controleDeAcesso = controleDeAcesso; }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(controleDeAcesso).addPathPatterns("/api/**");
    }

    /** Gera e confere hashes de senha (BCrypt com salt). */
    @Bean
    public BCryptPasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }
}
