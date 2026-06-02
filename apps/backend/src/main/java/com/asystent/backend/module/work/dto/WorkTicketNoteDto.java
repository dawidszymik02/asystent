package com.asystent.backend.module.work.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record WorkTicketNoteDto(
        UUID id,
        UUID ticketId,
        UUID userId,
        String content,
        OffsetDateTime createdAt
) {}
