package com.asystent.backend.module.calendar.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
public class UpdateEventRequest {
    private String title;
    private String description;
    private OffsetDateTime startTime;
    private OffsetDateTime endTime;
    private Boolean isAllDay;
    private UUID categoryId;
    private String location;
    private String color;
    private String recurrenceRule;
    private OffsetDateTime recurrenceEndDate;
    private Integer reminderMinutes;
}
