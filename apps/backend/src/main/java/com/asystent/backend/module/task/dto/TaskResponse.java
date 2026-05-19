package com.asystent.backend.module.task.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record TaskResponse(
        UUID id,
        UUID userId,
        String title,
        LocalDate date,
        boolean completed,
        OffsetDateTime completedAt,
        int position,
        OffsetDateTime createdAt
) {}
