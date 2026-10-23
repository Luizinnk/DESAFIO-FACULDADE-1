package br.univille.agendauni.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.univille.agendauni.model.Local;
import jakarta.persistence.LockModeType;

public interface LocalRepository extends JpaRepository<Local, Long> {

    /**
     * Trava a linha do local até o fim da transação (SELECT ... FOR UPDATE).
     * Assim, duas aprovações no mesmo local acontecem uma depois da outra,
     * e a segunda enxerga a primeira na checagem de conflito.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT l FROM Local l WHERE l.id = :id")
    Optional<Local> travar(@Param("id") Long id);
}
