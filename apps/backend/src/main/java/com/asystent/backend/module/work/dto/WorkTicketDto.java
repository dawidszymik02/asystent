package com.asystent.backend.module.work.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record WorkTicketDto(
        UUID id,
        UUID userId,
        String title,
        String description,
        String clientName,
        UUID programId,
        String status,
        String priority,
        String sourceRef,
        OffsetDateTime resolvedAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}
