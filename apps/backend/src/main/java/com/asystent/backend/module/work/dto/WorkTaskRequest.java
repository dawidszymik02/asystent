package com.asystent.backend.module.work.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.OffsetDateTime;
import java.util.UUID;

public record WorkTaskRequest(
        @NotBlank String title,
        String description,
        String type,
        String clientName,
        UUID programId,
        String status,
        OffsetDateTime dueDate
) {}
