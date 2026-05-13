package com.asystent.backend.module.calendar.repository;

import com.asystent.backend.module.calendar.entity.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, UUID> {

    List<CalendarEvent> findByUserIdAndIsCancelledFalseOrderByStartTimeAsc(UUID userId);

    List<CalendarEvent> findByUserIdAndStartTimeBetweenAndIsCancelledFalse(
            UUID userId, OffsetDateTime from, OffsetDateTime to);

    @Query("SELECT e FROM CalendarEvent e WHERE e.userId = :userId AND e.isCancelled = false " +
           "AND (e.startTime BETWEEN :from AND :to OR e.recurrenceRule IS NOT NULL) " +
           "ORDER BY e.startTime")
    List<CalendarEvent> findEventsForExpansion(
            @Param("userId") UUID userId,
            @Param("from") OffsetDateTime from,
            @Param("to") OffsetDateTime to);

    Optional<CalendarEvent> findByIdAndUserId(UUID id, UUID userId);
}
