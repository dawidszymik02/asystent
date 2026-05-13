package com.asystent.backend.module.calendar.dto;

import com.asystent.backend.module.calendar.entity.CalendarEvent.SourceModule;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class CalendarEventDto {
    private UUID id;
    private UUID userId;
    private String title;
    private String description;
    private OffsetDateTime startTime;
    private OffsetDateTime endTime;
    private Boolean isAllDay;
    private String location;
    private String color;
    private SourceModule sourceModule;
    private UUID sourceId;
    private UUID categoryId;
    private String categoryName;
    private String categoryColor;
    private String recurrenceRule;
    private OffsetDateTime recurrenceEndDate;
    private Integer reminderMinutes;
    private Boolean isCancelled;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
