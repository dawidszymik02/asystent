package com.asystent.backend.module.knowledge.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record TicketSummary(
        UUID id,
        String title,
        String clientName,
        String programName,
        String statusName,
        LocalDateTime createdAt
) {
}
