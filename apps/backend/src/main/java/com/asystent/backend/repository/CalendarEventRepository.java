package com.asystent.backend.repository;

import com.asystent.backend.entity.CalendarEvent;
import com.asystent.backend.entity.CalendarEvent.SourceModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, UUID> {

    List<CalendarEvent> findByUserId(UUID userId);

    List<CalendarEvent> findByUserIdAndStartTimeBetween(
            UUID userId, OffsetDateTime from, OffsetDateTime to);

    List<CalendarEvent> findByUserIdAndSourceModule(UUID userId, SourceModule sourceModule);
}
