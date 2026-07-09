package com.asystent.backend.module.knowledge.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record TaskSummary(
        UUID id,
        String title,
        LocalDateTime dueDate
) {
}
