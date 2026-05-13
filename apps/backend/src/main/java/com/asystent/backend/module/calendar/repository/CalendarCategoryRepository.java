package com.asystent.backend.module.calendar.repository;

import com.asystent.backend.module.calendar.entity.CalendarCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CalendarCategoryRepository extends JpaRepository<CalendarCategory, UUID> {

    List<CalendarCategory> findByUserIdOrderByNameAsc(UUID userId);

    Optional<CalendarCategory> findByIdAndUserId(UUID id, UUID userId);
}
