package com.asystent.backend.module.calendar.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class CalendarCategoryDto {
    private UUID id;
    private UUID userId;
    private String name;
    private String color;
    private String icon;
    private OffsetDateTime createdAt;
}
