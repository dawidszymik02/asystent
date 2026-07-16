package com.asystent.backend.module.knowledge.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record WorkTaskSummary(
        UUID id,
        String title,
        String description,
        String clientName,
        String programName,
        String status,
        LocalDateTime dueDate
) {
}
