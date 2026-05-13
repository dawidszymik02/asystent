package com.asystent.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

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

    @Column(name = "all_day")
    private Boolean allDay = false;

    @Column(name = "location")
    private String location;

    @Column(name = "color")
    private String color = "#3B82F6";

    @Column(name = "source_module")
    @Enumerated(EnumType.STRING)
    private SourceModule sourceModule = SourceModule.MANUAL;

    @Column(name = "source_id")
    private UUID sourceId;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public enum SourceModule {
        MANUAL, WORK, TRAINING
    }
}
