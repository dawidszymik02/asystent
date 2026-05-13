package com.asystent.backend.module.calendar.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "calendar_events", schema = "public")
@Getter
@Setter
@NoArgsConstructor
public class CalendarEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description")
    private String description;

    @Column(name = "start_time", nullable = false)
    private OffsetDateTime startTime;

    @Column(name = "end_time")
    private OffsetDateTime endTime;

    @Column(name = "is_all_day")
    private Boolean isAllDay = false;

    @Column(name = "location")
    private String location;

    @Column(name = "color")
    private String color = "#3B82F6";

    @Column(name = "source_module")
    @Enumerated(EnumType.STRING)
    private SourceModule sourceModule = SourceModule.MANUAL;

    @Column(name = "source_id")
    private UUID sourceId;

    @Column(name = "category_id")
    private UUID categoryId;

    @Column(name = "recurrence_rule")
    private String recurrenceRule;

    @Column(name = "recurrence_end_date")
    private OffsetDateTime recurrenceEndDate;

    @Column(name = "excluded_dates", columnDefinition = "TEXT")
    private String excludedDates;

    @Column(name = "reminder_minutes")
    private Integer reminderMinutes;

    @Column(name = "is_cancelled")
    private Boolean isCancelled = false;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist
    void prePersist() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public enum SourceModule {
        MANUAL, WORK, TRAINING
    }
}
