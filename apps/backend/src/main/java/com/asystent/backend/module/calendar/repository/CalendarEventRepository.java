package com.asystent.backend.module.calendar.repository;

import com.asystent.backend.module.calendar.entity.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
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

    Optional<CalendarEvent> findByIdAndUserId(UUID id, UUID userId);
}
