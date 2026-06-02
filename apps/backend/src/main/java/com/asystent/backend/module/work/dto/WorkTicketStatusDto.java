package com.asystent.backend.module.work.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record WorkTicketStatusDto(
        UUID id,
        UUID userId,
        String key,
        String label,
        String color,
        String bgColor,
        Integer sortOrder,
        Boolean isActive,
        OffsetDateTime createdAt
) {}
