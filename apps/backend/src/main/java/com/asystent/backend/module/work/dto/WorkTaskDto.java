package com.asystent.backend.module.work.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record WorkTaskDto(
        UUID id,
        UUID userId,
        String title,
        String description,
        String type,
        String clientName,
        UUID programId,
        String status,
        OffsetDateTime dueDate,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}
