package com.asystent.backend.module.knowledge.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record TicketDetails(
        UUID id,
        String title,
        String description,
        String clientName,
        String programName,
        String statusName,
        List<String> notes,
        LocalDateTime createdAt
) {
}
