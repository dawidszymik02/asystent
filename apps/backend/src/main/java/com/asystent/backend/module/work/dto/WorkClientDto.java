package com.asystent.backend.module.work.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record WorkClientDto(
        UUID id,
        UUID userId,
        String name,
        OffsetDateTime createdAt
) {}
