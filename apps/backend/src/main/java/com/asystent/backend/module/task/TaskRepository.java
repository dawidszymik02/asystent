package com.asystent.backend.module.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {

    List<Task> findByUserIdAndDateOrderByCompletedAscPositionAsc(UUID userId, LocalDate date);

    @Query("SELECT COALESCE(MAX(t.position), -1) FROM Task t WHERE t.userId = :userId AND t.date = :date")
    int findMaxPositionByUserIdAndDate(@Param("userId") UUID userId, @Param("date") LocalDate date);
}
