package br.univille.agendauni.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.univille.agendauni.model.Bloqueio;

public interface BloqueioRepository extends JpaRepository<Bloqueio, Long> {

    List<Bloqueio> findByDataFimGreaterThanEqualOrderByDataInicio(LocalDate data);

    /** Bloqueio do local que cobre a data informada (se existir). */
    @Query("SELECT b FROM Bloqueio b WHERE b.local.id = :localId AND :data BETWEEN b.dataInicio AND b.dataFim")
    List<Bloqueio> doLocalNaData(@Param("localId") Long localId, @Param("data") LocalDate data);

    default Optional<Bloqueio> buscar(Long localId, LocalDate data) {
        return doLocalNaData(localId, data).stream().findFirst();
    }
}
