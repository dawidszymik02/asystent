package com.asystent.backend.module.work.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record WorkProgramDto(
        UUID id,
        UUID userId,
        String name,
        String shortCode,
        String color,
        String description,
        Boolean isActive,
        OffsetDateTime createdAt
) {}
