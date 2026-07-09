package com.asystent.backend.module.knowledge.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record EventSummary(
        UUID id,
        String title,
        LocalDateTime startTime,
        LocalDateTime endTime,
        String description
) {
}
