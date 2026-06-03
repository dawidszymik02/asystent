package com.asystent.backend.module.dashboard.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record DashboardNoteDto(
        UUID id,
        UUID userId,
        String content,
        OffsetDateTime updatedAt
) {}
