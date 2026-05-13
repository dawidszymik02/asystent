package com.asystent.backend.module.calendar.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
public class CreateEventRequest {

    @NotBlank
    private String title;

    private String description;

    @NotNull
    private OffsetDateTime startTime;

    private OffsetDateTime endTime;
    private Boolean isAllDay = false;
    private UUID categoryId;
    private String location;
    private String color;
    private String recurrenceRule;
    private OffsetDateTime recurrenceEndDate;
    private Integer reminderMinutes;
}
