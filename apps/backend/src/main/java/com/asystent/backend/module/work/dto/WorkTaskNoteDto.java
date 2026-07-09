package com.asystent.backend.module.work.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record WorkTaskNoteDto(
        UUID id,
        UUID taskId,
        UUID userId,
        String content,
        OffsetDateTime createdAt
) {}
